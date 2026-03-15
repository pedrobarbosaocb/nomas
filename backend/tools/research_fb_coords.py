import re

def analyze_fb_coords(html_path):
    print(f"Analyzing: {html_path}")
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all occurrences of latitude/longitude
    # We look for patterns like "latitude":45.123,"longitude":-73.456
    matches = re.findall(r'\"latitude\":([-0-9.]+),\"longitude\":([-0-9.]+)', content)
    
    if not matches:
        print("No latitude/longitude patterns found.")
        return

    print(f"Found {len(matches)} coordinate entries.")
    
    unique_coords = set(matches)
    print(f"Unique coordinate pairs: {len(unique_coords)}")
    for coord in unique_coords:
        count = matches.count(coord)
        print(f"  {coord}: {count} occurrences")

if __name__ == "__main__":
    analyze_fb_coords('tools/test_fb.html')
