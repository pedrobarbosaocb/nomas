import re
import json

def find_unique_locations(html_path):
    print(f"Analyzing Location Data in: {html_path}")
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Look for location-related strings
    # Pattern: "location_text":{"text":"Montreal, Quebec"}
    location_texts = re.findall(r'\"location_text\":\{\"text\":\"(.*?)\"', content)
    
    # Look for "neighborhood"
    neighborhoods = re.findall(r'\"neighborhood\":\{\"name\":\"(.*?)\"', content)

    # Look for "distance_from_visitor" (might be listing specific)
    distances = re.findall(r'\"distance_from_visitor\":([-0-9.]+)', content)

    print(f"Results:")
    print(f"  Location Texts Found: {len(location_texts)}")
    print(f"  Unique Location Texts: {set(location_texts)}")
    
    print(f"  Neighborhoods Found: {len(neighborhoods)}")
    print(f"  Unique Neighborhoods: {set(neighborhoods)}")

    print(f"  Distances relative to visitor: {len(distances)}")
    if distances:
        print(f"  Example Distances: {distances[:5]}")

if __name__ == "__main__":
    find_unique_locations('tools/test_fb.html')
