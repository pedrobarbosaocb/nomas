import sys
import os

# Ensure facebook-marketplace-scraper is in path
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
sys.path.append(os.path.join(parent_dir, "facebook-marketplace-scraper"))

try:
    from app import crawl_facebook_marketplace
except ImportError as e:
    raise ImportError(f"Facebook scraper module not found in {parent_dir}. ({e})")

def search_facebook(city, max_price, bedrooms=None, max_results=None):
    print(f"\n[Facebook] Searching for {city} rentals...")
    try:
        raw = crawl_facebook_marketplace(city=city.lower(), query="", max_price=max_price, bedrooms=bedrooms, max_results=max_results)
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
