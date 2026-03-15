import sys
import os
sys.path.append(os.getcwd())

import re
from processor import extract_max_bedrooms, BEDROOM_RE, BEDROOM_MAPPING

def debug_extract_max_bedrooms(text: str) -> int:
    t = text.lower()
    t = t.replace("½", " 1/2")
    t = t.replace(",", ".")
    
    # Updated logic
    t = re.sub(r'(\d+)\s*[\-\/]\s*1\s*/\s*2', r'\1 1/2', t)
    t = re.sub(r'(\d+)1/2', r'\1 1/2', t)
    t = re.sub(r'(?<!1)\s*/\s*2(?!\d)', r' 1/2', t)
    
    print(f"  [DEBUG] Input: '{text}' -> Normalized: '{t}'")
    
    matches = BEDROOM_RE.findall(f" {t} ")
    print(f"  [DEBUG] Matches: {matches}")
    
    if not matches:
        return -1
    
    max_beds = -1
    for m in matches:
        m_low = m.lower().strip()
        print(f"    [DEBUG] Checking match: '{m_low}'")
        val = -1
        
        found_in_mapping = False
        for pattern, bed_count in BEDROOM_MAPPING.items():
            if pattern in m_low:
                val = bed_count
                found_in_mapping = True
                print(f"      [DEBUG] Found in mapping: '{pattern}' -> {bed_count}")
                break
        
        if not found_in_mapping:
            if "bed" in m_low or "chambre" in m_low:
                num_match = re.search(r'(\d+)', m_low)
                if num_match:
                    val = int(num_match.group(1))
                    print(f"      [DEBUG] Found as bedroom keyword: {val}")
            elif any(x in m_low for x in ["studio", "bachelor", "bacalauréat"]):
                val = 0
                print(f"      [DEBUG] Found as studio/bachelor: 0")
            elif "1/2" in m_low or "." in m_low:
                num_match = re.search(r'(\d+)', m_low)
                if num_match:
                    n = int(num_match.group(1))
                    if n <= 2: val = 0
                    else: val = n - 2
                    print(f"      [DEBUG] Fallback fraction/decimal: {n} -> {val}")
            
        if val > max_beds:
            max_beds = val
            
    return max_beds

def test_normalization():
    cases = [
        ("3 1/2", 1),
        ("3.5", 1),
        ("3½", 1),
        ("3-1/2", 1),
        ("3/2", 1),
        ("3 / 2", 1),
        ("31/2", 1),
        ("10 1/2", 8),
    ]
    
    failed = 0
    for text, expected in cases:
        print(f"Testing: '{text}'")
        result = debug_extract_max_bedrooms(text)
        if result == expected:
            print(f"[PASS] -> {result}\n")
        else:
            print(f"[FAIL] -> expected {expected}, got {result}\n")
            failed += 1
            
    if failed == 0:
        print("All debug tests passed!")
    else:
        print(f"{failed} debug tests failed.")

if __name__ == "__main__":
    test_normalization()
