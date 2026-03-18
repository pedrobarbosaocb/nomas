import sys
import os

from .base import BaseScraper

# Ensure facebook-marketplace-scraper is in path
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
sys.path.append(os.path.join(parent_dir, "facebook-marketplace-scraper"))

try:
    from app import crawl_facebook_marketplace
except ImportError as e:
    raise ImportError(f"Facebook scraper module not found in {parent_dir}. ({e})")

class FacebookScraper(BaseScraper):
    def __init__(self, city=None, max_results=None):
        super().__init__(city)
        self.max_results = max_results
        self.city_lower = self.city.lower()

    def search(self):
        print(f"\n[Facebook] Searching for {self.city} rentals...")
        try:
            # We updated crawl_facebook_marketplace to not require pricing or bedrooms
            raw = crawl_facebook_marketplace(city=self.city_lower, max_results=self.max_results)
            results = []
            for r in raw:
                results.append({
                    "source": "Facebook Marketplace", "title": r.get('title', ''), "price": r.get('price', ''),
                    "location": r.get('location', ''), "description": r.get('description', ''),
                    "unit_details": r.get('unit_details', ''), "link": r.get('link', ''),
                    "latitude": r.get('latitude'), "longitude": r.get('longitude'),
                    "images": r.get('images', [])
                })
            return results
        except Exception as e:
            print(f"Facebook Error: {e}")
            return []
