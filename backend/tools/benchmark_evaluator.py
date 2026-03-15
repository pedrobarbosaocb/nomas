"""
benchmark_evaluator.py
----------------------
Independent performance testing tool for ApartmentFinder filtering.
Tests accuracy, precision, and recall against manual ground truths.
"""

import sys
import os
import json
import argparse
from pathlib import Path

# Add root to sys.path to import processor
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import processor

def load_ground_truth(gt_path: Path) -> dict:
    with open(gt_path, encoding="utf-8") as f:
        return json.load(f)

def evaluate(predictions: dict, ground_truth: dict, label: str = "", verbose: bool = False):
    tp = tn = fp = fn = 0
    fp_details = []
    fn_details = []
    
    for title, expected in ground_truth.items():
        predicted_data = predictions.get(title)
        if predicted_data is None: continue
        
        predicted = predicted_data[0] if isinstance(predicted_data, (list, tuple)) else predicted_data
        reason = predicted_data[1] if isinstance(predicted_data, (list, tuple)) and len(predicted_data) > 1 else ""

        if expected and predicted: tp += 1
        elif not expected and not predicted: tn += 1
        elif not expected and predicted: 
            fp += 1
            fp_details.append((title, reason))
        else: 
            fn += 1
            fn_details.append((title, f"Expected rejection but was kept"))

    total = tp + tn + fp + fn
    acc = (tp + tn) / total * 100 if total else 0
    prec = tp / (tp + fp) * 100 if (tp + fp) else 0
    rec = tp / (tp + fn) * 100 if (tp + fn) else 0
    f1 = 2 * (prec * rec) / (prec + rec) if (prec + rec) else 0
    
    print(f"\n  [{label}]")
    print(f"  TP: {tp:3d} | TN: {tn:3d} | FP: {fp:3d} | FN: {fn:3d}")
    print(f"  Accuracy: {acc:5.1f}% | Precision: {prec:5.1f}% | Recall: {rec:5.1f}% | F1: {f1:5.1f}%")
    
    if verbose and fp_details:
        print("  False Positives (Good listings rejected):")
        for title, reason in fp_details:
            print(f"    - {title} | Reason: {reason}")
            
    return {"accuracy": acc, "precision": prec, "recall": rec, "f1": f1, "tp": tp, "tn": tn, "fp": fp, "fn": fn}

def main():
    if sys.stdout.encoding.lower() != 'utf-8':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/test_datasets/quebec_blind_test.json")
    parser.add_argument("--gt", help="Path to ground truth JSON file")
    parser.add_argument("--threshold", type=float, default=0.60)
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        print(f"Error: {data_path} not found.")
        sys.exit(1)

    # Resolve Ground Truth Path
    if args.gt:
        gt_path = Path(args.gt)
    else:
        # Auto-detect
        data_str = str(data_path).lower()
        if "quebec" in data_str or "blind" in data_str:
            gt_path = Path("data/ground_truth/quebec_blind_gt.json")
        elif "montreal" in data_str:
            gt_path = Path("data/ground_truth/montreal_gt.json")
        else:
            # Fallback for generic test.json names if they exist
            gt_path = Path("data/ground_truth/montreal_gt.json")

    if not gt_path.exists():
        print(f"Error: Ground truth file {gt_path} not found.")
        sys.exit(1)

    with open(data_path, encoding="utf-8") as f:
        listings = json.load(f)

    target_gt = load_ground_truth(gt_path)
    
    # Filter listings for benchmark
    gt_listings = []
    for l in listings:
        for k in target_gt:
            if k.lower() in (l.get("title", "") or "").lower():
                gt_listings.append((k, l))
                break

    if not gt_listings:
        print(f"Warning: No listings in {data_path} matched keys in {gt_path}.")
        sys.exit(0)

    model = processor.load_embedding_model()
    rej_emb, keep_emb = processor.build_anchor_embeddings(model)

    print(f"\nEvaluating on {len(gt_listings)} ground-truth items...")
    print(f"Dataset: {data_path}")
    print(f"Labels:  {gt_path}")

    # Stage A (Keyword)
    a_preds = {k: processor.keyword_filter(l) for k, l in gt_listings}
    evaluate(a_preds, target_gt, "Stage A (Keyword Only)", verbose=True)

    # Stage B (Embedding)
    b_preds = {k: processor.embedding_filter(l, model, rej_emb, keep_emb, args.threshold) for k, l in gt_listings}
    evaluate(b_preds, target_gt, "Stage B (Embedding Only)", verbose=True)

    # Hybrid
    h_preds = {}
    for k in a_preds:
        # Hybrid is A or B
        res_a = a_preds[k]
        res_b = b_preds[k]
        if res_a[0]:
            h_preds[k] = res_a
        else:
            h_preds[k] = res_b
            
    evaluate(h_preds, target_gt, "Hybrid (Stage A -> B)", verbose=True)

if __name__ == "__main__":
    main()
