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
                
    return all_data
