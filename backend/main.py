"""
main.py
-------
Main entry point for the ApartmentFinder application.
Loads settings, runs concurrent scrapers, filters/enriches data, and saves outputs
using single-responsibility modules.
"""

import sys
import io
import os
from pathlib import Path
from dotenv import load_dotenv

# Local pipeline modules
from config import load_settings
from scrapers.runner import run_scrapers
from pipeline import enrich_data, process_listings
from utils import save_json

def main():
    # 0. Load Environment Variables from backend/.env
    env_path = Path(__file__).parent / ".env"
    load_dotenv(dotenv_path=env_path)

    import argparse
    parser = argparse.ArgumentParser(description="Apartment Finder Pipeline")
    parser.add_argument("--skip-scrape", action="store_true", help="Skip scraping and load from the last backup instead.")
    args = parser.parse_args()

    # 1. Load configuration
    conf_path = Path(__file__).parent / "settings" / "search_settings.json"
    conf = load_settings(str(conf_path))
    if not conf:
        print(f"Error: {conf_path} not found.")
        return

    city = conf.get("city", "montreal")
    max_results = conf.get("max_results", None)
    max_pages = conf.get("max_pages", 100)
    
    out_dir = Path(conf.get("output_dir", "data/"))
    out_dir.mkdir(exist_ok=True)

    # 2. Run Scrapers
    if args.skip_scrape:
        import json
        backup_file = out_dir / "scraped_backup.json"
        if backup_file.exists():
            print(f"\n[Recovery Mode] Skipping scraping. Loading data directly from {backup_file}...")
            with open(backup_file, 'r', encoding='utf-8') as f:
                all_data = json.load(f)
        else:
            print(f"Error: --skip-scrape was used but {backup_file} does not exist.")
            return
    else:
        all_data = run_scrapers(city, max_results, max_pages)

    # 3. Enrich Data
    structured_raw, enrichment_texts = enrich_data(all_data)
    
    # Save enriched but unlabelled raw locally
    raw_file = out_dir / "apartments_raw.json"
    save_json(structured_raw, raw_file)

    # 4. Insert Listings to Postgres
    process_listings(structured_raw)
    
    print(f"Results have been synced securely to the Postgres database.")

if __name__ == "__main__":
    if sys.stdout.encoding.lower() != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    main()
