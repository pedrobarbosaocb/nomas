import urllib.request
import json
import sys

def test_search(payload):
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/listings/search', 
        data=json.dumps(payload).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            print(f"Payload: {payload} -> Total: {res.get('total')}, Returned: {len(res.get('items', []))}")
            if res.get('items'):
                print(f"  First Item Title: {res['items'][0]['info']['title']}")
    except Exception as e:
        print(f"Error testing {payload}: {e}")

print("Testing API Pagination and Filters:")
test_search({"page": 1, "limit": 10})
test_search({"page": 1, "limit": 10, "ratingFilter": "liked"})
test_search({"page": 1, "limit": 10, "ratingFilter": "not-rated"})
test_search({"page": 1, "limit": 5, "maxPrice": "1500"})
test_search({"page": 1, "limit": 5, "aiLabels": ["1 Bedroom"]})
