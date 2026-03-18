import os
import sys
import argparse
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add project root to path
script_dir = os.path.dirname(os.path.abspath(__file__))
classifier_dir = os.path.dirname(script_dir)
backend_dir = os.path.dirname(classifier_dir)
sys.path.append(backend_dir)

from utils import save_json

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("google-genai not installed. Please install it to use this script.")
    exit(1)

def chunk_list(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

def classify_mock_listings(listings_batch):
    """
    Returns random mock labels mapped to IDs to avoid using the Gemini API during testing.
    """
    import random
    mock_labels = [
        "commercial", "parking space", "short stay", 
        "room in shared apartment/house", "studio", 
        "1-bed", "2-bed", "3-bed", "4-bed", 
        "5+ bedroom apartment", "unknown"
    ]
    labels = {}
    for item in listings_batch:
        labels[item["id"]] = random.choice(mock_labels)
    return labels

def classify_listings(listings_batch, client):
    """
    Calls the Gemini API to label a batch of up to `batch_size` listings at once.
    """
    prompt = (
        "You are an expert real estate data classifier. I will give you a list of apartment listings. "
        "Each listing has an ID. Based on the Title and Description, classify each listing "
        "into one of the following categories: 'commercial', 'parking space', 'short stay', "
        "'room in shared apartment/house', 'studio', '1-bed', '2-bed', '3-bed', '4-bed', "
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
                        "room in shared apartment/house", "studio", 
                        "1-bed", "2-bed", "3-bed", "4-bed", 
                        "5+ bedroom apartment", "unknown"
                    ]
                }
            },
            "required": ["id", "category"]
        }
    }

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
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
            
        results = json.loads(text.strip())
        labels = {item["id"]: item.get("category", "unknown") for item in results if "id" in item}
        return labels
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {}

def process_batch_worker(batch, client, mock_mode):
    """
    Worker function executed asynchronously by the ThreadPoolExecutor.
    """
    if mock_mode:
        time.sleep(1) # Fake delay
        return batch, classify_mock_listings(batch)
    else:
        return batch, classify_listings(batch, client)

def main():
    parser = argparse.ArgumentParser(description="Label Kijiji training data using Gemini API natively.")
    parser.add_argument("--batch-size", type=int, default=250, help="Number of listings to send to Gemini per API call.")
    parser.add_argument("--limit", type=int, default=None, help="Process at most this many unlabeled listings.")
    parser.add_argument("--input", type=str, default="data/raw/kijiji_canada_unlabeled.json", help="Relative path to raw listings.")
    parser.add_argument("--out", type=str, default="classifier/training_data/kijiji_canada_labeled.json", help="Relative output file path.")
    parser.add_argument("--mock", action="store_true", help="Bypass the API and insert mock classifications.")
    parser.add_argument("--workers", type=int, default=4, help="Number of concurrent API batches. Set up to 12 for speed, but watch out for API rate limits.")
    args = parser.parse_args()

    # Create root absolute paths
    in_path = Path(backend_dir) / args.input
    out_path = Path(backend_dir) / args.out

    if not in_path.exists():
        print(f"Error: Raw input data missing at {in_path}. Please run scrape_kijiji.py first.")
        return

    with open(in_path, 'r', encoding='utf-8') as f:
        scraped_data = json.load(f)

    print(f"Loaded {len(scraped_data)} raw listings. Checking existing labeled progress...")

    # Load environment + Gemini
    client = None
    if not args.mock:
        load_dotenv(Path(backend_dir) / ".env")
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("Warning: GEMINI_API_KEY environment variable not found. Use --mock or add it to .env.")
            return
        client = genai.Client(api_key=api_key)

    labeled_data_map = {}
    if out_path.exists():
        try:
            with open(out_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
                for item in existing_data:
                    if 'id' in item and 'ai_label' in item:
                        labeled_data_map[item['id']] = item
            print(f"Loaded {len(labeled_data_map)} previously labeled listings.")
        except Exception as e:
            print(f"Error loading existing data: {e}. Starting fresh.")

    # Filter out items that are already labeled using the deterministic Hash-ID
    unlabeled_data = [item for item in scraped_data if item['id'] not in labeled_data_map]
    
    if args.limit and args.limit > 0:
        unlabeled_data = unlabeled_data[:args.limit]

    print(f"Found {len(unlabeled_data)} unlabeled listings to process.")

    if not unlabeled_data:
        print("All raw listings are already labeled. Exiting.")
        return

    batches = list(chunk_list(unlabeled_data, args.batch_size))
    total_processed = 0

    print(f"Classifying {len(batches)} batches asynchronously with {args.workers} workers...")
    
    # Process the batches concurrently using ThreadPoolExecutor for high performance labeling
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_batch = {
            executor.submit(process_batch_worker, batch, client, args.mock): batch 
            for batch in batches
        }
        
        # As batches complete, capture and save the data
        for i, future in enumerate(as_completed(future_to_batch)):
            completed_batch, labels = future.result()
            
            for listing in completed_batch:
                listing_id = listing['id']
                label = labels.get(listing_id, "unknown")
                listing['ai_label'] = label
                labeled_data_map[listing_id] = listing
                
            total_processed += len(completed_batch)
            print(f"  > Batch {i+1}/{len(batches)} completed. ({len(completed_batch)} items labeled.)")
            
            # Save checkpoint
            save_json(list(labeled_data_map.values()), str(out_path))

    print(f"\nCompleted! Generated {len(labeled_data_map)} total finalized training examples saved to {args.out}.")

if __name__ == "__main__":
    main()
