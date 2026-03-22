import os
import sys
import argparse
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
sys.path.append(backend_dir)

from db.connection import get_db_connection
from classifiers.gemini.classifier import classify_listings, classify_mock_listings, test_api_key

try:
    from google import genai
except ImportError:
    print("google-genai not installed. Please install it to use this script.")
    exit(1)

def chunk_list(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

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
        from psycopg2.extras import DictCursor
        cursor = conn.cursor(cursor_factory=DictCursor)
        query = "SELECT id, title, description, link FROM listings WHERE ai_label IS NULL"
        if retry_unknown:
            query += " OR ai_label = 'unknown'"
            
        if limit and limit > 0:
            query += f" LIMIT {limit}"
            
        cursor.execute(query)
        results = cursor.fetchall()
        return [dict(r) for r in results]
    except Exception as e:
        print(f"Error fetching from DB: {e}")
        return []
    finally:
        if conn and not conn.closed:
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
            
        from psycopg2.extras import execute_batch
        execute_batch(cursor, update_query, args_list)
        conn.commit()
    except Exception as e:
        print(f"Error updating DB: {e}")
    finally:
        if conn and not conn.closed:
            cursor.close()
            conn.close()

def main():
    parser = argparse.ArgumentParser(description="Label unclassified database listings using Gemini API.")
    parser.add_argument("--batch-size", type=int, default=10, help="Number of listings to send to Gemini per API call.")
    parser.add_argument("--limit", type=int, default=None, help="Process at most this many unlabeled listings.")
    parser.add_argument("--mock", action="store_true", help="Bypass the API and insert mock classifications.")
    parser.add_argument("--workers", type=int, default=4, help="Number of concurrent API batches.")
    parser.add_argument("--retry-unknown", action="store_true", help="Re-process any listings that previously failed API bounds")
    args = parser.parse_args()

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
