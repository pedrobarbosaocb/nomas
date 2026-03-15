import sys
import os
sys.path.append(os.getcwd())

from processor import keyword_filter

def test_room_filter():
    # Listing that should be rejected (Stage A Keyword Filter)
    cases = [
        {"title": "Chambre privée à Montreal"},
        {"title": "Chambres privées à Montreal"},
        {"title": "chambre privee"},
        {"title": "chambres privees"},
        {"title": "chambre privee "},
        {"title": "chambre privee."},
        {"title": "chambre privee..."},
        {"title": "chambreprivee"}, # Misspelled but maybe too hard without regex
        {"title": "chambre priv"}, # Partial
        {"title": "chambres privées de luxe"},
    ]
    
    print("Testing Keyword Filter for 'chambres privées' variations:")
    failed = 0
    for listing in cases:
        title = listing["title"]
        should_reject, reason = keyword_filter(listing)
        if should_reject:
            print(f"[PASS] '{title}' -> Rejected (Reason: {reason})")
        else:
            print(f"[FAIL] '{title}' -> NOT Rejected")
            failed += 1
            
    if failed == 0:
        print("\nAll tests passed!")
    else:
        print(f"\n{failed} tests failed.")

if __name__ == "__main__":
    test_room_filter()
