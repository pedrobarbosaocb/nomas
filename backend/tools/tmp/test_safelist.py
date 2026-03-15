import sys
import os
sys.path.append(os.getcwd())

from processor import keyword_filter

def test_safelist():
    # Test cases that should NOT be rejected (False Positives in previous versions)
    pass_cases = [
        {"title": "Beau 4 1/2 near centre commercial", "description": "Great location near shopping center"},
        {"title": "Apartment for rent", "description": "Good landlords looking for a good tenant"},
        {"title": "3 1/2 à distance de marche du métro", "description": "Walking distance to metro"},
        {"title": "Spacieux 4 1/2", "description": "Recherche bon locataire sérieux"},
        {"title": "Logement à louer", "description": "Quartier recherché et tranquille"},
    ]
    
    # Test cases that SHOULD be rejected
    fail_cases = [
        {"title": "Room for rent", "description": "Private room with shared kitchen"},
        {"title": "Recherche colocataire", "description": "Looking for a roommate"},
        {"title": "Commercial space", "description": "Office space available"},
        {"title": "Magnifique chalet à louer", "description": "Beau chalet avec vue sur la montagne"},
        {"title": "Appartement par jour", "description": "100$ par nuit"},
        {"title": "Luxury stay per night", "description": "Available for $200 per night"},
        {"title": "Daily rental", "description": "Daily rate is $150"},
    ]
    
    failed = 0
    print("Testing Pass Cases (Should not be rejected):")
    for listing in pass_cases:
        rej, reason = keyword_filter(listing, min_bedrooms=1)
        if not rej:
            print(f"  [PASS] {listing['title']} -> Not rejected")
        else:
            print(f"  [FAIL] {listing['title']} -> REJECTED for '{reason}'")
            failed += 1
            
    print("\nTesting Fail Cases (Should be rejected):")
    for listing in fail_cases:
        rej, reason = keyword_filter(listing, min_bedrooms=1)
        if rej:
            print(f"  [PASS] {listing['title']} -> Rejected for '{reason}'")
        else:
            print(f"  [FAIL] {listing['title']} -> NOT REJECTED")
            failed += 1
            
    if failed == 0:
        print("\nAll safelist tests passed!")
    else:
        print(f"\n{failed} tests failed.")

if __name__ == "__main__":
    test_safelist()
