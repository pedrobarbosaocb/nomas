import json
import re
from bs4 import BeautifulSoup

def find_metadata(file_path):
    print(f"\n--- Inspecting {file_path} ---")
    try:
        # Use utf-8 by default, fallback to utf-16 if needed
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except:
            with open(file_path, "r", encoding="utf-16") as f:
                content = f.read()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # 1. Search for JSON-LD
        json_ld = soup.find_all('script', type='application/ld+json')
        if json_ld:
            print(f"Found {len(json_ld)} JSON-LD blocks.")
            for i, script in enumerate(json_ld):
                try:
                    data = json.loads(script.string)
                    # Look for geo coordinates or address
                    print(f"Block {i}: {str(data)[:200]}...")
                except: pass
        
        # 2. Search for common keywords in all scripts
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                for kw in ["latitude", "longitude", "latitude\":", "longitude\":", "coord", "transit"]:
                    if kw in script.string:
                        print(f"Keyword '{kw}' found in a script block.")
                        # Extract the context
                        pos = script.string.find(kw)
                        print(f"Context: {script.string[max(0, pos-50):pos+100]}...")
                        break
                        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import os
    for f in ["tools/kijiji_test.html", "tools/test_fb.html"]:
        if os.path.exists(f):
            find_metadata(f)
