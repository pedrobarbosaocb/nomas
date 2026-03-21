import os
import sys
import argparse
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add project root to path
script_dir = os.path.dirname(os.path.abspath(__file__))
classifier_dir = os.path.dirname(script_dir)
backend_dir = os.path.dirname(classifier_dir)
sys.path.append(backend_dir)

from db import get_db_connection
from dotenv import load_dotenv

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("google-genai not installed. Please install it to use this script.")
    exit(1)

def chunk_list(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

LABEL_MAP = {
    "commercial": 0,
    "parking space": 1,
    "short stay": 2,
    "room(s) in shared apartment/house": 3,
    "studio": 4,
    "1-bed": 5,
    "2-bed": 6,
    "3-bed": 7,
    "4-bed": 8,
    "5+ bedroom apartment": 9,
    "unknown": 10
}

def classify_mock_listings(listings_batch):
    """
    Returns random mock labels mapped to IDs to avoid using the Gemini API during testing.
    """
    import random
    mock_labels = [
        "commercial", "parking space", "short stay", 
        "room(s) in shared apartment/house", "studio", 
        "1-bed", "2-bed", "3-bed", "4-bed", 
        "5+ bedroom apartment", "unknown"
    ]
    labels = {}
    for item in listings_batch:
        string_label = random.choice(mock_labels)
        labels[item["id"]] = {
            "str": string_label,
            "int": LABEL_MAP.get(string_label, 10)
        }
    return labels

def classify_listings(listings_batch, client):
    """
    Calls the Gemini API to label a batch of up to `batch_size` listings at once.
    """
    prompt = (
        "You are an expert real estate data classifier. I will give you a list of apartment listings. "
        "Each listing has an ID. Based on the Title and Description, classify each listing "
        "into one of the following categories: 'commercial', 'parking space', 'short stay', "
        "'room(s) in shared apartment/house', 'studio', '1-bed', '2-bed', '3-bed', '4-bed', "
        "'5+ bedroom apartment', or 'unknown'.\n\n"
        "Return ONLY a strictly valid JSON array matching the provided schema.\n\n"
        "Listings:\n"
    )
    
    for item in listings_batch:
        i_id = item['id']
        title = item.get('title', '').replace('\n', ' ')
        desc = item.get('description', '').replace('\n', ' ')[:500]
        prompt += f"ID: {i_id} | Title: {title} | Desc: {desc}\n"

    schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "category": {
                    "type": "string",
                    "enum": [
                        "commercial", "parking space", "short stay", 
                        "room(s) in shared apartment/house", "studio", 
                        "1-bed", "2-bed", "3-bed", "4-bed", 
                        "5+ bedroom apartment", "unknown"
                    ]
                }
            },
            "required": ["id", "category"]
        }
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash-lite',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json", 
                    response_schema=schema,
                    temperature=0.1,
                    max_output_tokens=65536
                )
            )
            text = response.text
            import json
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
                
            results = json.loads(text.strip())
            labels = {}
            for item in results:
                if "id" in item:
                    string_category = item.get("category", "unknown")
                    labels[item["id"]] = {
                        "str": string_category,
                        "int": LABEL_MAP.get(string_category, 10)
                    }
            return labels
        except Exception as e:
            print(f"Error calling Gemini API (Attempt {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            
    print("Max retries reached. Skipping batch to prevent saving 'unknown' permanently.")
    return None
        
def test_api_key(client):
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents="Respond 'OK' if you can read this."
        )
        if response.text:
            return True
    except Exception as e:
        print(f"CRITICAL API ERROR: The provided API key is invalid or unauthorized.\nDetails: {e}")
    return False

def process_batch_worker(batch, client, mock_mode):
    if mock_mode:
        time.sleep(1)
        return batch, classify_mock_listings(batch)
    else:
        return batch, classify_listings(batch, client)

def fetch_unclassified(limit=None, retry_unknown=False):
    """Fetches unclassified listings from the database."""
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database.")
        return []

    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT id, title, description, link FROM listings WHERE ai_label IS NULL"
        if retry_unknown:
            query += " OR ai_label = 'unknown'"
            
        if limit and limit > 0:
            query += f" LIMIT {limit}"
            
        cursor.execute(query)
        results = cursor.fetchall()
        return results
    except Exception as e:
        print(f"Error fetching from DB: {e}")
        return []
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def update_labels_in_db(labels):
    """Updates the labels in the database."""
    if not labels:
        return
        
    conn = get_db_connection()
    if not conn:
        print("Failed to save to database.")
        return

    try:
        cursor = conn.cursor()
        update_query = "UPDATE listings SET ai_label = %s, ai_label_int = %s WHERE id = %s"
        
        args_list = []
        for i_id, label_data in labels.items():
            args_list.append((label_data['str'], label_data['int'], i_id))
            
        cursor.executemany(update_query, args_list)
        conn.commit()
    except Exception as e:
        print(f"Error updating DB: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def main():
    parser = argparse.ArgumentParser(description="Label unclassified database listings using Gemini API.")
    parser.add_argument("--batch-size", type=int, default=10, help="Number of listings to send to Gemini per API call.")
    parser.add_argument("--limit", type=int, default=None, help="Process at most this many unlabeled listings.")
    parser.add_argument("--mock", action="store_true", help="Bypass the API and insert mock classifications.")
    parser.add_argument("--workers", type=int, default=4, help="Number of concurrent API batches.")
    parser.add_argument("--retry-unknown", action="store_true", help="Re-process any listings that were previously labeled 'unknown'.")
    args = parser.parse_args()

    # Load environment + Gemini
    client = None
    if not args.mock:
        load_dotenv(os.path.join(backend_dir, ".env"), override=True)
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("Warning: GEMINI_API_KEY environment variable not found. Use --mock or add it to .env.")
            return
        client = genai.Client(api_key=api_key)

        if not client:
            return
            
        print("Testing API Key validity...")
        if not test_api_key(client):
            print("\nAborting: Please ensure you placed a valid Google AI Studio API key inside backend/.env")
            return
            
        print("API Key validated successfully.")
            
    print("Fetching unclassified listings from Database...")
    unlabeled_data = fetch_unclassified(limit=args.limit, retry_unknown=args.retry_unknown)

    if not unlabeled_data:
        print("No unclassified listings found in the database. Exiting.")
        return
        
    print(f"Found {len(unlabeled_data)} unclassified listings to process.")

    batches = list(chunk_list(unlabeled_data, args.batch_size))
    total_processed = 0

    print(f"Classifying {len(batches)} batches asynchronously with {args.workers} workers...")
    
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_batch = {
            executor.submit(process_batch_worker, batch, client, args.mock): batch 
            for batch in batches
        }
        
        for i, future in enumerate(as_completed(future_to_batch)):
            completed_batch, labels = future.result()
            
            if labels is None:
                print(f"  > Batch {i+1}/{len(batches)} failed repeatedly. Skipping save for this batch to allow future retries.")
                continue
                
            update_labels_in_db(labels)
            total_processed += len(completed_batch)
            print(f"  > Batch {i+1}/{len(batches)} completed. ({len(completed_batch)} items labeled.)")

    print(f"\nCompleted! Labeled {total_processed} listings and saved to the database.")

if __name__ == "__main__":
    main()
