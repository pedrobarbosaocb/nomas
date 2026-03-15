import re
from bs4 import BeautifulSoup

def extract_description(item_html):
    item_soup = BeautifulSoup(item_html, 'html.parser')
    
    # Robust description extraction from script data or body text (prevent clipping)
    description = ''
    # 1. Try to find the full description in script JSON data
    scripts = item_soup.find_all('script')
    for script in scripts:
        if script.string and '"listing_description"' in script.string:
            try:
                # Look for the description value after the key
                # Note: we use a relaxed regex to catch it in various script formats
                desc_match_json = re.search(r'"listing_description":\s*"(.*?)"', script.string)
                if desc_match_json:
                    # Handle escaped characters
                    # The decode part is a bit tricky in a standalone script without proper encoding context,
                    # but we emulate the app.py logic
                    raw_desc = desc_match_json.group(1)
                    # Simple unescape for test
                    description = raw_desc.replace('\\n', '\n').replace('\\"', '"')
                    break
            except:
                continue
    
    if not description:
        # Fallback to body text extraction
        body_text_full = item_soup.body.get_text(separator=' | ', strip=True) if item_soup.body else ''
        desc_match = re.search(r'Description \| (.*?)( \| Seller Information| \| Location| \| Listing Details| \| Unit Details|$)', body_text_full, re.IGNORECASE)
        if desc_match:
            description = desc_match.group(1).strip()
    
    return description

def test_fb_extraction():
    # Mock HTML with script tag containing full description
    mock_html_script = """
    <html>
    <body>
        <script>
            var data = {"listing_description": "This is the full description from the script tag. It should not be clipped.\\n\\nIncludes 2 bedrooms and 1 bath."};
        </script>
        <div>Description | This is a truncated... | See more | Seller Information</div>
    </body>
    </html>
    """
    
    # Mock HTML with NO script tag (fallback to body)
    mock_html_body = """
    <html>
    <body>
        <div>Description | This is the full body description | Location | Seller Information</div>
    </body>
    </html>
    """
    
    print("Testing Script-based Extraction:")
    desc1 = extract_description(mock_html_script)
    if "full description from the script tag" in desc1:
        print(f"  [PASS] Extracted: '{desc1[:50]}...'")
    else:
        print(f"  [FAIL] Got: '{desc1}'")
        
    print("\nTesting Body-fallback Extraction:")
    desc2 = extract_description(mock_html_body)
    if "full body description" in desc2:
        print(f"  [PASS] Extracted: '{desc2[:50]}...'")
    else:
        print(f"  [FAIL] Got: '{desc2}'")

if __name__ == "__main__":
    test_fb_extraction()
