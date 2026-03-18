"""
main.py
-------
Main entry point for the ApartmentFinder application.
Loads settings, runs concurrent scrapers, filters/enriches data, and saves outputs
using single-responsibility modules.
"""

import sys
import io
from pathlib import Path

# Local pipeline modules
from config import load_settings
from scrapers.runner import run_scrapers
from pipeline import enrich_data, process_listings
from utils import save_json

def main():
    # 1. Load configuration
    conf = load_settings("settings/search_settings.json")
    if not conf:
        print("Error: settings/search_settings.json not found.")
        return

    city = conf.get("city", "montreal")
    max_results = conf.get("max_results", None)
    
    out_dir = Path(conf.get("output_dir", "data/"))
    out_dir.mkdir(exist_ok=True)

    # 2. Run Scrapers
    all_data = run_scrapers(city, max_results)

    # 3. Enrich Data
    structured_raw, enrichment_texts = enrich_data(all_data)
    
    # Save raw
    raw_file = out_dir / "apartments_raw.json"
    save_json(structured_raw, raw_file)

    # 4. Process/Filter Listings
    if conf.get("process_listings", True):
        passed, rejected = process_listings(structured_raw, enrichment_texts, conf)
        
        # Save processed
        save_json(passed, out_dir / "processed_apartments.json")
        save_json(rejected, out_dir / "rejected_apartments.json")
        
        print(f"Done! {len(passed)} accepted, {len(rejected)} rejected.")
        print(f"Results in {out_dir}/")

if __name__ == "__main__":
    if sys.stdout.encoding.lower() != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    main()
