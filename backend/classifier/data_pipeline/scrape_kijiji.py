import os
import sys
import argparse
import time
import hashlib
from pathlib import Path

# Add project root to path so we can import scrapers and utils
script_dir = os.path.dirname(os.path.abspath(__file__))
classifier_dir = os.path.dirname(script_dir)
backend_dir = os.path.dirname(classifier_dir)
sys.path.append(backend_dir)

from scrapers.kijiji import KijijiScraper
from utils import save_json

def generate_listing_id(listing: dict) -> str:
    """
    Generate a consistent Hash-ID for a property listing.
    
    Why: Kijiji and other platforms sometimes rotate their internal IDs or
    hide them. To ensure we don't label the exact same property multiple times
    across different days, we create a deterministic MD5 hash based strictly
    on the listing's Title and its URL Link.
    
    If the implementation changes in the future, this guarantees that old
    data and new data can still be cross-referenced without duplicating items
    that share the same Title and Link.
    """
    unique_str = f"{listing.get('title', '')}{listing.get('link', '')}"
    return hashlib.md5(unique_str.encode('utf-8')).hexdigest()

def main():
    parser = argparse.ArgumentParser(description="Scrape Kijiji listings securely for AI labeling.")
    parser.add_argument("--limit", type=int, default=5000, help="Maximum number of listings to scrape.")
    parser.add_argument("--out", type=str, default="data/raw/kijiji_canada_unlabeled.json", help="Relative output file path.")
    parser.add_argument("--workers", type=int, default=12, help="Number of CPU threads to use for speed.")
    args = parser.parse_args()

    print(f"Starting Kijiji Pipeline Scraper for 'canada' with limit {args.limit}...")
    print(f"Using {args.workers} concurrent workers to maximize CPU threading.")
    
    scraper = KijijiScraper(city="canada", max_results=args.limit, max_workers=args.workers)
    scraped_data = scraper.search()
    
    if not scraped_data:
        print("No listings found. Exiting.")
        return

    print(f"\nScraped {len(scraped_data)} listings. Hashing unique IDs...")
    
    # Apply the consistent Hash-ID algorithm
    for listing in scraped_data:
        listing['id'] = generate_listing_id(listing)

    # Save to disk
    out_path = Path(backend_dir) / args.out
    
    # Load previously raw data if it already exists so we just append to it (without duplicates)
    raw_data_map = {}
    if out_path.exists():
        import json
        try:
            with open(out_path, 'r', encoding='utf-8') as f:
                existing = json.load(f)
                for item in existing:
                    if 'id' in item:
                        raw_data_map[item['id']] = item
            print(f"Merged {len(raw_data_map)} previously scraped raw listings.")
        except Exception as e:
            print(f"Error loading existing raw data: {e}")

    # Add the new data
    for item in scraped_data:
        raw_data_map[item['id']] = item

    out_path.parent.mkdir(parents=True, exist_ok=True)
    save_json(list(raw_data_map.values()), str(out_path))

    print(f"Completed! Total raw dataset size: {len(raw_data_map)} listings saved to {args.out}.")

if __name__ == "__main__":
    main()
