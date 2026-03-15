"""
main.py
-------
Main entry point for the ApartmentFinder application.
Loads settings from settings/search_settings.json, scrapes Kijiji & Facebook,
and then processes/filters the results using processor.py.
"""

import sys
import os
import json
from pathlib import Path

# Local module imports
import processor
from scrapers.kijiji import search_kijiji
from scrapers.facebook import search_facebook

def main():
    # Load settings
    settings_path = Path("settings/search_settings.json")
    if not settings_path.exists():
        print("Error: settings/search_settings.json not found.")
        return

    with open(settings_path) as f:
        conf = json.load(f)

    city = conf.get("city", "montreal")
    max_price = conf.get("max_price", 1500)
    bedrooms = conf.get("bedrooms", 2)
    out_dir = Path(conf.get("output_dir", "data/"))
    out_dir.mkdir(exist_ok=True)

    # Scrape
    all_data = search_kijiji(city, max_price, bedrooms)
    all_data.extend(search_facebook(city, max_price, bedrooms))

    # Enrich: compute text_for_enrichment once per listing and share it
    # with both enrich() and keyword_filter() to avoid recomputation.
    print("\nPreparing raw data with consistent structure...")
    structured_raw = []
    enrichment_texts = []  # parallel list, re-used in filtering stage
    for item in all_data:
        t = processor.text_for_enrichment(item)
        enrichment_texts.append(t)
        structured_raw.append(processor.enrich(item, text=t))

    # Save raw
    raw_file = out_dir / "apartments_raw.json"
    with open(raw_file, "w", encoding="utf-8") as f:
        json.dump(structured_raw, f, indent=4, ensure_ascii=False)
    print(f"Saved {len(structured_raw)} raw listings to {raw_file}")

    # Process
    if conf.get("process_listings", True):
        print("\nStarting Filtering & Enrichment...")
        model = None
        rej_emb = keep_emb = None
        if conf.get("use_embeddings", True):
            model = processor.load_embedding_model()
            rej_emb, keep_emb = processor.build_anchor_embeddings(model)

        threshold = conf.get("ai_threshold", 0.55)

        # ── Stage A: keyword filter (fast, no model needed) ─────────────────
        # Split into definite rejects and candidates for embedding stage.
        keyword_passed = []   # (item, text) tuples that survived keyword filter
        passed = []
        rejected = []

        for item, t in zip(structured_raw, enrichment_texts):
            k_rej, k_reason = processor.keyword_filter(item, min_bedrooms=bedrooms, text=t)
            if k_rej:
                item_with_reason = dict(item)
                item_with_reason["reject_reason"] = k_reason
                rejected.append(item_with_reason)
            else:
                keyword_passed.append((item, t))

        # ── Stage B: batch embedding filter ─────────────────────────────────
        if model and keyword_passed:
            # Build all snippets at once — model.encode() is called only once
            snippets = []
            for item, t in keyword_passed:
                info = item.get("info", {}) if isinstance(item.get("info"), dict) else {}
                title = item.get("title", "") or info.get("title", "") or ""
                desc  = item.get("description", "") or info.get("description", "") or ""
                snippets.append((title + " " + desc)[:300])

            batch_results = processor.embedding_filter_batch(
                snippets, model, rej_emb, keep_emb, threshold
            )

            for (item, _), (e_rej, _, e_reason) in zip(keyword_passed, batch_results):
                if e_rej:
                    item_with_reason = dict(item)
                    item_with_reason["reject_reason"] = e_reason
                    rejected.append(item_with_reason)
                else:
                    passed.append(item)
        else:
            # No embedding model — everything that passed keyword filter is accepted
            passed.extend(item for item, _ in keyword_passed)

        # Save processed
        with open(out_dir / "processed_apartments.json", "w", encoding="utf-8") as f:
            json.dump(passed, f, indent=4, ensure_ascii=False)
        with open(out_dir / "rejected_apartments.json", "w", encoding="utf-8") as f:
            json.dump(rejected, f, indent=4, ensure_ascii=False)

        print(f"Done! {len(passed)} accepted, {len(rejected)} rejected.")
        print(f"Results in {out_dir}/")

if __name__ == "__main__":
    if sys.stdout.encoding.lower() != 'utf-8':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    main()
