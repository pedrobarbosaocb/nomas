import processor

def enrich_data(all_data):
    """
    Computes text_for_enrichment once per listing and enriches the data.
    Returns the enriched raw structures and the enrichment texts.
    """
    print("\nPreparing raw data with consistent structure...")
    structured_raw = []
    enrichment_texts = []
    for item in all_data:
        t = processor.text_for_enrichment(item)
        enrichment_texts.append(t)
        structured_raw.append(processor.enrich(item, text=t))
    return structured_raw, enrichment_texts


def process_listings(structured_raw, enrichment_texts, conf):
    """
    Performs keyword filtering and batch embedding filtering on the data.
    Returns two lists: passed listings and rejected listings.
    """
    print("\nStarting Filtering & Enrichment...")
    model = None
    rej_emb = keep_emb = None
    if conf.get("use_embeddings", True):
        model = processor.load_embedding_model()
        rej_emb, keep_emb = processor.build_anchor_embeddings(model)

    threshold = conf.get("ai_threshold", 0.55)
    bedrooms = conf.get("bedrooms", 2)

    # ── Stage A: keyword filter (fast, no model needed) ─────────────────
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

    return passed, rejected
