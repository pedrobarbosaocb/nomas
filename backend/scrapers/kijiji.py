import sys
import os
import requests
import re
import json
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed

# Ensure Kijiji-Scraper is in path
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
sys.path.append(os.path.join(parent_dir, "Kijiji-Scraper"))

try:
    from kijiji_scraper.kijiji_scraper import KijijiScraper
except ImportError as e:
    raise ImportError(f"Kijiji-Scraper module not found in {parent_dir}. ({e})")

KIJIJI_LOCATIONS = {
    "montreal": "80002",
    "vancouver": "80003",
    "quebec": "1700124",
    "ottawa": "1700185"
}

# Quebec apartment size notation: X 1/2 rooms
# 1 1/2 = studio, 2 1/2 = studio+, 3 1/2 = 1 bedroom, 4 1/2 = 2 bedrooms, 5 1/2 = 3 bedrooms
# We want bedrooms >= 2, which means >= 4 1/2 rooms in Quebec notation.
# For English: we want "2 bedroom", "3 bedroom" etc.
_SKIP_TITLE_PATTERNS_1BED = [
    re.compile(r'\b(studio|bachelor|1\s+bedroom|1bedroom|one\s+bedroom)\b', re.I),
    # Quebec: 1 1/2, 2 1/2, 3 1/2 (all mean 1 bedroom or less)
    re.compile(r'\b[123]\s*(?:et demi|1/2)\b', re.I),
    re.compile(r'\b[123](?:\.5|,5)\b'),
]

_HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}


def _fetch_listing_details(ad_id, ad, bedrooms):
    """
    Worker function: fetches a single Kijiji listing page and returns a
    fully populated result dict, or None if the listing should be skipped.
    """
    title_lower = ad.get('Title', '').lower()

    # Skip clear 1-bedroom/studio listings early
    if bedrooms and bedrooms >= 2:
        if any(p.search(title_lower) for p in _SKIP_TITLE_PATTERNS_1BED):
            return None

    link = ad.get('Url', '')
    desc = ad.get('Description', '')
    walk = transit = bike = ""
    lat = lon = None
    images = []
    res = None

    if link.startswith('http'):
        try:
            res = requests.get(link, headers=_HEADERS, timeout=10)
            soup = BeautifulSoup(res.content, 'html.parser')
            text = soup.get_text(separator=' ', strip=True)

            # Extract full description
            m = re.search(
                r'Description\s+(.*?)\s+(?:About|Explore\s+the\s+area|Map|Location|Address)',
                text, re.DOTALL | re.IGNORECASE
            )
            if m:
                desc = m.group(1).strip()

            # Extract coordinates from og: meta tags
            lat_tag = soup.find('meta', property='og:latitude')
            lon_tag = soup.find('meta', property='og:longitude')
            lat = float(lat_tag['content']) if lat_tag else None
            lon = float(lon_tag['content']) if lon_tag else None

            # Fallback: JSON-LD geo block
            if not lat:
                ld_json = soup.find('script', type='application/ld+json')
                if ld_json:
                    try:
                        ld_data = json.loads(ld_json.string)
                        if isinstance(ld_data, list):
                            ld_data = ld_data[0]
                        geo = ld_data.get('geo', {})
                        lat = float(geo.get('latitude'))
                        lon = float(geo.get('longitude'))
                    except Exception:
                        pass

            # Walk/Transit/Bike scores
            for sc in re.finditer(r'([Ww]alk|[Tt]ransit|[Bb]ike)\s+[sS]core\s+(\d{1,3})\b', text):
                s_type, s_val = sc.group(1).lower(), sc.group(2)
                if s_type == 'walk':    walk    = s_val
                elif s_type == 'transit': transit = s_val
                elif s_type == 'bike':  bike    = s_val

            # Images — high-res Kijiji CDN URLs
            img_pattern = r'https?://media\.kijiji\.ca/api/v1/[^/]+/images/[^?"]+\?rule=kijijica-[\w-]+'
            found = re.findall(img_pattern, res.text)
            for img_url in found:
                base = img_url.split('?')[0]
                high_res = f"{base}?rule=kijijica-960-jpg"
                if high_res not in images:
                    images.append(high_res)

            # Fallback: scrape gallery container
            if not images:
                main_gallery = soup.find('div', class_=re.compile(r'hero-image|image-gallery|main-images', re.I))
                if main_gallery:
                    for img in main_gallery.find_all('img'):
                        src = img.get('src') or img.get('data-src') or img.get('data-config-src')
                        if src and 'http' in src and 'jpg' in src.lower() and src not in images:
                            src = src.replace('?rule=kijijica-160-jpg', '?rule=kijijica-960-jpg')
                            images.append(src)

        except Exception:
            pass

    return {
        "source": "Kijiji",
        "title": ad.get('Title', ''),
        "price": ad.get('Price', ''),
        "location": ad.get('Location', ''),
        "description": desc,
        "walk_score": walk,
        "transit_score": transit,
        "bike_score": bike,
        "link": link,
        "latitude": lat,
        "longitude": lon,
        "images": images,
    }


def search_kijiji(city, max_price, bedrooms=None, max_workers=8, loc_id=None):
    print(f"\n[Kijiji] Searching for {city} apartments (<${max_price}, {bedrooms}+ beds)...")
    city_lower = city.lower()
    if not loc_id:
        loc_id = KIJIJI_LOCATIONS.get(city_lower, "0")

    # Construct base URL with category and location
    # Format: https://www.kijiji.ca/b-apartments-condos/[city]/[bedrooms]/c30349001l[loc_id]
    bedroom_path = ""
    if bedrooms:
        segs = []
        if bedrooms <= 1: segs.append("1+bedroom")
        if bedrooms <= 2: segs.append("2+bedrooms")
        if bedrooms <= 3: segs.append("3+bedrooms")
        if bedrooms <= 4: segs.append("4+bedrooms")
        if not segs: segs = ["1+bedroom"]
        bedroom_path = "__".join(segs) + "/"
    
    scraper = KijijiScraper(filename=None)
    results = []
    page_num = 1
    
    try:
        while True:
            print(f"  > Exploring page {page_num}...")
            url = f"https://www.kijiji.ca/b-apartments-condos/{city_lower}/page-{page_num}/{bedroom_path}c30349001l{loc_id}?price=0__{max_price}"
            
            # Reset the scraper's new_ads for each page call
            scraper.new_ads = {}
            # We call with multi_page=False because we are handling the loop here
            new_ads, _ = scraper.scrape_kijiji_for_ads(url, multi_page=False)
            
            if not new_ads:
                print(f"  > No more results found on page {page_num}. Ending search.")
                break

            # Fetch all listing pages in parallel
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {
                    executor.submit(_fetch_listing_details, ad_id, ad, bedrooms): ad_id
                    for ad_id, ad in new_ads.items()
                }
                page_results_count = 0
                for future in as_completed(futures):
                    try:
                        result = future.result()
                        if result is not None:
                            results.append(result)
                            page_results_count += 1
                    except Exception as e:
                        print(f"Kijiji worker error: {e}")
                
            print(f"  > Found {page_results_count} valid listings on page {page_num}.")
            
            page_num += 1
            # Safety break to avoid infinite loops
            if page_num > 100:
                print("  > Reached limit of 100 pages. Stopping.")
                break

    except Exception as e:
        print(f"Kijiji Error during search: {e}")

    return results
