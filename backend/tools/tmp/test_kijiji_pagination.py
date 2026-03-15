import sys
import os

# Add parent directory to path to find scrapers
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.kijiji import search_kijiji

def test_kijiji_pagination():
    print("Testing Kijiji Pagination...")
    # Using a city and price that likely has multiple pages
    # Montreal, < 1000000, 2+ beds will definitely have many pages
    results = search_kijiji("montreal", 1000000, bedrooms=2, max_workers=20)
    
    print(f"\nTest finished. Total results found: {len(results)}")
    if len(results) > 40:
        print("SUCCESS: Found more than one page of results!")
    else:
        print("WARNING: Found 40 or fewer results. This might be correct if there are few listings, or pagination might still be failing.")

if __name__ == "__main__":
    test_kijiji_pagination()
