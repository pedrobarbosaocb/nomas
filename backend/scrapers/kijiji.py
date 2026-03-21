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

from dotenv import load_dotenv
load_dotenv(os.path.join(parent_dir, ".env"))

from .base import BaseScraper

try:
    from kijiji_scraper.kijiji_scraper import KijijiScraper as KijijiAPI
except ImportError as e:
    raise ImportError(f"Kijiji-Scraper module not found in {parent_dir}. ({e})")

KIJIJI_LOCATIONS = {
    "montreal": "80002",
    "vancouver": "80003",
    "quebec": "1700124",
    "ottawa": "1700185",
    "canada": "0"
}

_HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}


def _fetch_listing_details(ad_id, ad):
    """
    Worker function: fetches a single Kijiji listing page and returns a
    fully populated result dict.
    """
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


def _scrape_page_worker(city_lower, loc_id, page_num):
    """
    Worker function: fetches a single search results page and returns its ads.
    """
    url = f"https://www.kijiji.ca/b-apartments-condos/{city_lower}/page-{page_num}/c30349001l{loc_id}"
    scraper = KijijiAPI(filename=None)
    ads, _ = scraper.scrape_kijiji_for_ads(url, multi_page=False)
    return page_num, ads


class KijijiScraper(BaseScraper):
    def __init__(self, city=None, max_workers=None, max_results=None):
        super().__init__(city)
        if max_workers is None:
            max_workers = int(os.environ.get("MAX_THREADS", 3))
        self.max_workers = max_workers
        self.max_results = max_results
        self.city_lower = self.city.lower()
        self.loc_id = KIJIJI_LOCATIONS.get(self.city_lower, "0")

    def search(self):
        print(f"\n[Kijiji] Searching for {self.city} apartments...")
        
        results = []
        page_num = 1
        # Scale batch size roughly with max workers (cap at 5 for Kijiji ban logic)
        batch_size = min(5, max(1, self.max_workers // 2))
        
        try:
            while True:
                if self.max_results and len(results) >= self.max_results:
                    break
                
                print(f"  > Fetching pages {page_num} to {page_num + batch_size - 1} concurrently...")
                
                new_ads_all = {}
                found_empty_page = False
                
                with ThreadPoolExecutor(max_workers=min(batch_size, self.max_workers)) as executor:
                    futures = [
                        executor.submit(_scrape_page_worker, self.city_lower, self.loc_id, p)
                        for p in range(page_num, page_num + batch_size)
                    ]
                    
                    for future in as_completed(futures):
                        try:
                            p_num, ads = future.result()
                            if not ads:
                                found_empty_page = True
                            else:
                                new_ads_all.update(ads)
                        except Exception as e:
                            print(f"    > Error fetching page: {e}")
                
                if not new_ads_all:
                    print(f"  > No results found in batch starting at page {page_num}. Ending search.")
                    break
                    
                print(f"  > Found {len(new_ads_all)} ads in page batch. Fetching details...")
                
                # Fetch all listing pages in parallel
                with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                    futures = {
                        executor.submit(_fetch_listing_details, ad_id, ad): ad_id
                        for ad_id, ad in new_ads_all.items()
                    }
                    batch_results_count = 0
                    for future in as_completed(futures):
                        try:
                            result = future.result()
                            if result is not None:
                                results.append(result)
                                batch_results_count += 1
                                if self.max_results and len(results) >= self.max_results:
                                    break
                        except Exception as e:
                            print(f"Kijiji worker error: {e}")
                            
                    # Cancel remaining futures if we hit the limit
                    if self.max_results and len(results) >= self.max_results:
                        for future in futures:
                            future.cancel()
                    
                print(f"  > Extracted {batch_results_count} valid listings from batch. Total so far: {len(results)}")
                
                if found_empty_page or (self.max_results and len(results) >= self.max_results):
                    print("  > Reached end of results or requested limit. Stopping.")
                    break
                    
                page_num += batch_size
                
                # Safety break to avoid infinite loops
                # 500 pages limit translates to roughly 20,000 listings
                if page_num > 500:
                    print("  > Reached hard limit of 500 pages. Stopping.")
                    break

        except Exception as e:
            print(f"Kijiji Error during search: {e}")

        return results
