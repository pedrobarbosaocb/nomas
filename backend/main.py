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
    conf_path = Path(__file__).parent / "settings" / "search_settings.json"
    conf = load_settings(str(conf_path))
    if not conf:
        print(f"Error: {conf_path} not found.")
        return

    city = conf.get("city", "montreal")
    max_results = conf.get("max_results", None)
    
    out_dir = Path(conf.get("output_dir", "data/"))
    out_dir.mkdir(exist_ok=True)

    # 2. Run Scrapers
    all_data = run_scrapers(city, max_results)

    # 3. Enrich Data
    structured_raw, enrichment_texts = enrich_data(all_data)
    
    # Save raw to maintain artifact backup locally if desired (optional)
    raw_file = out_dir / "apartments_raw.json"
    save_json(structured_raw, raw_file)

    # 4. Insert Listings to Postgres
    process_listings(structured_raw)
    
    print(f"Results have been synced securely to the Postgres database.")

if __name__ == "__main__":
    if sys.stdout.encoding.lower() != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    main()
