import io

try:
    with io.open("kijiji_test.html", "r", encoding="utf-16le") as f:
        content = f.read()
        print(f"File Size: {len(content)} characters")
        
        # Searching for 'search-item' which was the old class name
        print(f"Occurrences of 'search-item': {content.count('search-item')}")
        
        # Look for typical ad container clues
        import re
        matches = re.findall(r'class="([^"]*regular-ad[^"]*)"', content)
        if matches:
            print("Found regular-ad classes:", set(matches))
        else:
            print("No classes containing 'regular-ad' found.")

        price_matches = re.findall(r'class="([^"]*price[^"]*)"', content)
        if price_matches:
            print("Found price classes:", set(price_matches))
            
except Exception as e:
    print(e)
