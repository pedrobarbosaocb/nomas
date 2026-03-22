import concurrent.futures
from .kijiji import KijijiScraper
from .facebook import FacebookScraper

def run_scrapers(city, max_results=None, max_pages=100):
    """
    Initialize and run the configured scrapers concurrently,
    returning a flattened list of all scraped listings.
    """
    scrapers = [
        KijijiScraper(city=city, max_results=max_results, max_pages=max_pages),
        FacebookScraper(city=city, max_results=max_results)
    ]
    
    all_data = []
    print("\nStarting concurrent scraping of Kijiji and Facebook...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(scrapers)) as executor:
        # Submit all scraper.search() calls
        future_to_scraper = {executor.submit(scraper.search): scraper for scraper in scrapers}
        for future in concurrent.futures.as_completed(future_to_scraper):
            try:
                scraper_data = future.result()
                all_data.extend(scraper_data)
            except Exception as exc:
                print(f"A scraper generated an exception: {exc}")
                
    # Delegate backup save intrinsically to the scraper framework
    import json
    import os
    backup_path = os.path.join("data", "scraped_backup.json")
    os.makedirs("data", exist_ok=True)
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=4, ensure_ascii=False)
    print(f"\n[Scraper Framework] Intercepted and structurally backed up {len(all_data)} listings to {backup_path}")

    return all_data
