import sys
import os
sys.path.append(os.getcwd())

from processor import extract_max_bedrooms

def test_normalization():
    cases = [
        ("3 1/2", 1),
        ("4 1/2", 2),
        ("5 1/2", 3),
        ("3.5", 1),
        ("4.5", 2),
        ("3,5", 1),
        ("3½", 1),
        ("4½", 2),
        ("3-1/2", 1),
        ("3 - 1/2", 1),
        ("3/2", 1), # standardized from X / 2
        ("3 1 / 2", 1),
        ("10 1/2", 8),
        ("studio", 0),
        ("bachelor", 0),
        ("1 1/2", 0),
        ("2 1/2", 0),
        ("2 bedrooms", 2),
        ("3 chambres", 3),
        ("Grand 4 1/2 rénové", 2),
        ("Magnifique 3 1/2", 1),
        ("Looking for a 2 bedroom", 2),
    ]
    
    failed = 0
    for text, expected in cases:
        result = extract_max_bedrooms(text)
        if result == expected:
            print(f"[PASS] '{text}' -> {result}")
        else:
            print(f"[FAIL] '{text}' -> expected {expected}, got {result}")
            failed += 1
            
    if failed == 0:
        print("\nAll bedroom normalization tests passed!")
    else:
        print(f"\n{failed} tests failed.")

if __name__ == "__main__":
    test_normalization()
