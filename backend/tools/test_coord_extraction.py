import re
import json

def extract_fb_coords(html_path):
    print(f"Testing coordinate extraction from: {html_path}")
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Regex for "buyLocation":{"latitude":...,"longitude":...}
        match = re.search(r'"buyLocation":{"latitude":([-0-9.]+),"longitude":([-0-9.]+)}', content)
        if match:
            lat, lon = match.groups()
            print(f"SUCCESS: Found coordinates in buyLocation: {lat}, {lon}")
            return float(lat), float(lon)
            
        # Fallback regex for "location":{"latitude":...,"longitude":...}
        match = re.search(r'"location":{"latitude":([-0-9.]+),"longitude":([-0-9.]+)}', content)
        if match:
            lat, lon = match.groups()
            print(f"SUCCESS: Found coordinates in location: {lat}, {lon}")
            return float(lat), float(lon)
            
        print("FAILED: No coordinates found in this HTML.")
    except Exception as e:
        print(f"Error: {e}")
    return None

if __name__ == "__main__":
    extract_fb_coords("tools/test_fb.html")
