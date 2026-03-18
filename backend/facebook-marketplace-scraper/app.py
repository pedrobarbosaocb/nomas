# Description: This file contains the code for Passivebot's Facebook Marketplace Scraper API.
# Date: 2024-01-24
# Author: Harminder Nijjar
# Version: 1.0.0.
# Usage: python app.py


# Import the necessary libraries.
# Playwright is used to crawl the Facebook Marketplace.
from playwright.sync_api import sync_playwright
# The os library is used to get the environment variables.
import os
# The time library is used to add a delay to the script.
import time
# The BeautifulSoup library is used to parse the HTML.
from bs4 import BeautifulSoup
# The FastAPI library is used to create the API.
from fastapi import HTTPException, FastAPI
# The JSON library is used to convert the data to JSON.
import json
# The uvicorn library is used to run the API.
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
                 
# Create an instance of the FastAPI class.
app = FastAPI()
# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# Create a route to the root endpoint.
@app.get("/")
# Define a function to be executed when the endpoint is called.
def root():
    # Return a message.
    return {"message": "Welcome to Passivebot's Facebook Marketplace API. Documentation is currently being worked on along with the API. Some planned features currently in the pipeline are a ReactJS frontend, MongoDB database, and Google Authentication."}

    # TODO - Add documentation to the API.
    # TODO - Add a React frontend to the API.
    # TODO - Add a MongoDB database to the API.
    # TODO - Add Google Authentication to the React frontend.

# Create a route to the return_data endpoint.
@app.get("/crawl_facebook_marketplace")
# Define a function to be executed when the endpoint is called.
# Add a description to the function.
def crawl_facebook_marketplace(city: str, query: str = "", max_results: int = None):
    # Define dictionary of cities from the facebook marketplace directory for United States.
    # https://m.facebook.com/marketplace/directory/US/?_se_imp=0oey5sMRMSl7wluQZ
    # TODO - Add more cities to the dictionary.
    cities = {
        'New York': 'nyc',
        'Los Angeles': 'la',
        'Las Vegas': 'vegas',
        'Chicago': 'chicago',
        'Houston': 'houston',
        'San Antonio': 'sanantonio',
        'Miami': 'miami',
        'Orlando': 'orlando',
        'San Diego': 'sandiego',
        'Arlington': 'arlington',
        'Balitmore': 'baltimore',
        'Cincinnati': 'cincinnati',
        'Denver': 'denver',
        'Fort Worth': 'fortworth',
        'Jacksonville': 'jacksonville',
        'Memphis': 'memphis',
        'Nashville': 'nashville',
        'Philadelphia': 'philly',
        'Portland': 'portland',
        'San Jose': 'sanjose',
        'Tucson': 'tucson',
        'Atlanta': 'atlanta',
        'Boston': 'boston',
        'Columnbus': 'columbus',
        'Detroit': 'detroit',
        'Honolulu': 'honolulu',
        'Kansas City': 'kansascity',
        'New Orleans': 'neworleans',
        'Phoenix': 'phoenix',
        'Seattle': 'seattle',
        'Washington DC': 'dc',
        'Milwaukee': 'milwaukee',
        'Sacremento': 'sac',
        'Austin': 'austin',
        'Charlotte': 'charlotte',
        'Dallas': 'dallas',
        'El Paso': 'elpaso',
        'Indianapolis': 'indianapolis',
        'Louisville': 'louisville',
        'Minneapolis': 'minneapolis',
        'Oaklahoma City' : 'oklahoma',
        'Pittsburgh': 'pittsburgh',
        'San Francisco': 'sanfrancisco',
        'Tampa': 'tampa'
    }
    # Skip the city mapping logic from the original package and just use the string passed in
    # Define the URL to scrape. We target propertyrentals category
    # exact=true helps limit to the specified bounds
    marketplace_url = f'https://www.facebook.com/marketplace/{city}/propertyrentals/?exact=true'
        
    initial_url = "https://www.facebook.com/login/device-based/regular/login/"
    # Get listings of particular item in a particular city for a particular price.
    # Initialize the session using Playwright.
    with sync_playwright() as p:
        # Open a new browser page. We run this headlessly to avoid popping up a browser.
        browser = p.chromium.launch(headless=True)
        # We add some typical headers/user agents just to lower the chance of an immediate block
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        # Navigate directly to the marketplace URL instead of the login page
        # Facebook Marketplace properties can often be viewed publically without logging in
        print("Navigating to Facebook Marketplace...")
        page.goto(marketplace_url)
        # Wait for the property rental grid to appear
        try:
            page.wait_for_selector('a[href*="/marketplace/item/"]', timeout=30000)
        except Exception:
            print("Timeout waiting for listings to appear.")
            
        # Scroll a bit to load more items and ensure rendering
        for _ in range(3):
            page.keyboard.press('PageDown')
            time.sleep(1)
            
        html = page.content()
        soup = BeautifulSoup(html, 'html.parser')
        
        parsed = []
        # Find all unique listing links
        unique_links = set()
        listings_found = soup.find_all('a', href=lambda href: href and '/marketplace/item/' in href)
        
        for listing in listings_found:
            if max_results and len(parsed) >= max_results:
                break
            post_url_path = listing['href'].split('?')[0] # Remove query params for uniqueness
            if post_url_path in unique_links:
                continue
            unique_links.add(post_url_path)
            
            try:
                # Title, Price, and Location extraction
                # We'll try to find price ($) and others by searching text parts
                full_text = listing.get_text(separator='|')
                text_parts = [t.strip() for t in full_text.split('|') if t.strip()]
                
                # Get the item image.
                img_tag = listing.find('img')
                image = img_tag['src'] if img_tag else ''
                
                price = 'No Price'
                title = 'No Title'
                location = 'No Location'
                
                # Heuristic: First part containing $ is price
                for part in text_parts:
                    if '$' in part or 'CA$' in part:
                        price = part
                        break
                
                # Heuristic: The rest are title and location
                other_parts = [p for p in text_parts if p != price]
                if len(other_parts) >= 1:
                    title = other_parts[0]
                if len(other_parts) >= 2:
                    location = other_parts[1]
                
                post_url = 'https://www.facebook.com' + post_url_path
                
                # Fetch authentic description by visiting the post_url
                item_page = context.new_page()
                unit_details = ''
                walk_score = ''
                transit_score = ''
                bike_score = ''
                try:
                    item_page.goto(post_url, timeout=20000, wait_until='domcontentloaded')
                    time.sleep(2) # give JS content (incl. Getting Around section) time to render
                    item_html = item_page.content()
                    
                    # Extract coordinates (latitude/longitude) from script tags
                    import re
                    lat = lon = None
                    # Search specifically for listing coordinates first
                    listing_match = re.search(r'marketplace_listing_renderable_target.*?latitude":([-0-9.]+),"longitude":([-0-9.]+)', item_html)
                    if listing_match:
                        lat, lon = float(listing_match.group(1)), float(listing_match.group(2))
                    else:
                        # Fallback to general search
                        match = re.search(r'"latitude":([-0-9.]+),"longitude":([-0-9.]+)', item_html)
                        if match:
                            lat, lon = float(match.group(1)), float(match.group(2))
                    
                    item_soup = BeautifulSoup(item_html, 'html.parser')
                    
                    # Extract the item description from meta tags (reverted to original due to previous errors)
                    meta_desc = item_soup.find('meta', attrs={'name': 'description'})
                    description = meta_desc['content'] if meta_desc else ''
                    
                    import re
                    body_text = item_soup.body.get_text(separator=' | ', strip=True) if item_soup.body else ''
                    # Use plain-space text for score extraction - pipe separator breaks the regex
                    plain_text = item_soup.body.get_text(separator=' ', strip=True) if item_soup.body else ''
                    matches = re.search(r'(Unit [d|D]etails|Property [d|D]etails) \| (.*?)( \| Location| \| Description| \| Seller)', body_text)
                    if matches:
                        unit_details = matches.group(2).replace(' | ', ', ')
                        
                    # Extract all image links from the original listing
                    images = []
                    # 1. Primary: Try to find the image carousel/gallery thumbnails
                    # Facebook uses aria-label="Thumbnail X" for listing gallery items
                    thumbnails = item_soup.find_all('div', attrs={'aria-label': re.compile(r'Thumbnail \d+', re.I)})
                    
                    if thumbnails:
                        for thumb in thumbnails:
                            img = thumb.find('img')
                            src = img.get('src') if img else None
                            if src and 'fbcdn' in src and '/v/' in src and src not in images:
                                images.append(src)
                    
                    # 2. Fallback: Search all images with /v/ and fbcdn
                    if not images:
                        img_elements = item_soup.find_all('img')
                        for img in img_elements:
                            src = img.get('src')
                            if src and 'fbcdn' in src and '/v/' in src and src not in images:
                                # Heuristic: listing images usually have a high resolution in the URL or are in a predictable container
                                if '100x100' not in src and '50x50' not in src:
                                    images.append(src)
                        
                    # Extract Walk, Transit, Bike scores from plain text
                    # Facebook renders: 'Walk Score®︎ 92' so allow up to 5 non-digit chars
                    score_matches = re.finditer(r'(Walk|Transit|Bike) Score.{0,5}?(\d{1,3})', plain_text, re.IGNORECASE)
                    for m in score_matches:
                        score_type = m.group(1).lower()
                        score_val = m.group(2)
                        if score_type == 'walk' and not walk_score: walk_score = score_val
                        elif score_type == 'transit' and not transit_score: transit_score = score_val
                        elif score_type == 'bike' and not bike_score: bike_score = score_val
                        
                except Exception:
                    description = ''
                finally:
                    item_page.close()
                
                # Append the parsed data to the list.
                parsed.append({
                    'image': image,
                    'title': title,
                    'price': price,
                    'post_url': post_url,
                    'location': location,
                    'description': description,
                    'unit_details': unit_details,
                    'walk_score': walk_score,
                    'transit_score': transit_score,
                    'bike_score': bike_score,
                    'latitude': lat,
                    'longitude': lon,
                    'images': images
                })
            except Exception as e:
                print(f"Error parsing listing: {e}")
                
        # Close the browser.
        browser.close()
        # Return the parsed data as a JSON.
        result = []
        for item in parsed:
            result.append({
                'name': item.get('title', ''),
                'price': item.get('price', ''),
                'location': item.get('location', ''),
                'title': item.get('title', ''),
                'image': item.get('image', ''),
                'link': item.get('post_url', ''),
                'description': item.get('description', ''),
                'unit_details': item.get('unit_details', ''),
                'walk_score': item.get('walk_score', ''),
                'transit_score': item.get('transit_score', ''),
                'bike_score': item.get('bike_score', ''),
                'latitude': item.get('latitude'),
                'longitude': item.get('longitude'),
                'images': item.get('images', [])
            })
        return result

# Create a route to the return_html endpoint.
@app.get("/return_ip_information")
# Define a function to be executed when the endpoint is called.
def return_ip_information():
    # Initialize the session using Playwright.
    with sync_playwright() as p:
        # Open a new browser page.
        browser = p.chromium.launch()
        page = browser.new_page()
        # Navigate to the URL.
        page.goto('https://www.ipburger.com/')
        # Wait for the page to load.
        time.sleep(5)
        # Get the HTML content of the page.
        html = page.content()
        # Beautify the HTML content.
        soup = BeautifulSoup(html, 'html.parser')
        # Find the IP address.
        ip_address = soup.find('span', id='ipaddress1').text
        # Find the country.
        country = soup.find('strong', id='country_fullname').text
        # Find the location.
        location = soup.find('strong', id='location').text
        # Find the ISP.
        isp = soup.find('strong', id='isp').text
        # Find the Hostname.
        hostname = soup.find('strong', id='hostname').text
        # Find the Type.
        ip_type = soup.find('strong', id='ip_type').text
        # Find the version.
        version = soup.find('strong', id='version').text
        # Close the browser.
        browser.close()
        # Return the IP information as JSON.
        return {
            'ip_address': ip_address,
            'country': country,
            'location': location,
            'isp': isp,
            'hostname': hostname,
            'type': ip_type,
            'version': version
        }

if __name__ == "__main__":

    # Run the app.
    uvicorn.run(
        # Specify the app as the FastAPI app.
        'app:app',
        host='127.0.0.1',
        port=8000
    )
