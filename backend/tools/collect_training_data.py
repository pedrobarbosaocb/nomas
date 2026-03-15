import os
import sys
import json
import time

# Ensure project root is in path to import scraper
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
sys.path.append(project_root)

from scrapers.kijiji import search_kijiji

# Comprehensive list of locations
LOCATIONS = {
    # Quebec
    "montreal": "80002",
    "quebec-city": "1700124",
    "sherbrooke": "1700156",
    "trois-rivieres": "1700153",
    "gatineau": "1700189",
    "saguenay": "1700139",
    "rimouski": "1700129",
    "drummondville": "1700136",
    # Rest of Canada
    "toronto": "1700273",
    "ottawa": "1700185",
    "vancouver": "80003",
    "calgary": "1700199",
    "edmonton": "1700203",
    "winnipeg": "1700193",
    "halifax": "1700007",
    "victoria": "1700282",
    "london-on": "1700214",
    "hamilton": "1700275"
}

# Mapping of bedroom counts to specific labels the user wants
# We scrape for these numbers of bedrooms to get labeled data
BEDROOM_TARGETS = [
    (0, "1 1/2 / 2 1/2 / Studio"),
    (1, "3 1/2"),
    (2, "4 1/2"),
    (3, "5 1/2"),
    (4, "6 1/2+")
]

OUTPUT_FILE = os.path.join(project_root, "data", "raw_training_data.json")

def collect_data():
    all_data = []
    
    # Load existing data if any
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                all_data = json.load(f)
            print(f"Loaded {len(all_data)} existing records.")
        except Exception as e:
            print(f"Error loading existing data: {e}")

    for city, loc_id in LOCATIONS.items():
        print(f"\n{'='*50}\nSCRAPING CITY: {city.upper()} (ID: {loc_id})\n{'='*50}")
        
        for beds, label in BEDROOM_TARGETS:
            print(f"\n--- Targeted Search: {beds} bedrooms (Class: {label}) ---")
            
            # Use search_kijiji but we might need to modify it slightly to return "label"
            # For training, we force max_price to be high to get many listings
            listings = search_kijiji(city, max_price=5000, bedrooms=beds, max_workers=10, loc_id=loc_id)
            
            # Tag them with the ground truth from the search criteria
            for l in listings:
                l["target_label"] = label
                l["city"] = city
            
            all_data.extend(listings)
            
            # Save progress after each city/bedroom pair
            print(f"Saving progress... Total records: {len(all_data)}")
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(all_data, f, indent=2, ensure_ascii=False)
            
            # Grace period to avoid being blocked
            time.sleep(2)

    print(f"\nFinished! Total dataset size: {len(all_data)}")

if __name__ == "__main__":
    # Ensure data directory exists
    os.makedirs(os.path.join(project_root, "data"), exist_ok=True)
    collect_data()
