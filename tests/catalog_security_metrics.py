from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.analyzer.catalog_security_analyzer import analyze_rule_example, load_rules


def main() -> None:
    rules = load_rules()
    positive_total = len(rules)
    negative_total = len(rules)
    detected_positive = 0
    false_positive = 0

    for rule in rules:
        positive_ids = {finding.rule_id for finding in analyze_rule_example(rule, "bad_example")}
        negative_ids = {finding.rule_id for finding in analyze_rule_example(rule, "good_example")}
        detected_positive += int(rule["rule_id"] in positive_ids)
        false_positive += int(rule["rule_id"] in negative_ids)

    false_negative = positive_total - detected_positive
    precision = detected_positive / (detected_positive + false_positive) if detected_positive + false_positive else 0
    recall = detected_positive / positive_total if positive_total else 0
    false_positive_rate = false_positive / negative_total if negative_total else 0
    false_negative_rate = false_negative / positive_total if positive_total else 0

    print("Multi-language Secure Coding Catalog Metrics")
    print(f"Rule Count: {len(rules)}")
    print(f"Positive Samples: {positive_total}")
    print(f"Negative Samples: {negative_total}")
    print(f"Detection Count: {detected_positive}")
    print(f"Precision: {precision:.2%}")
    print(f"Recall: {recall:.2%}")
    print(f"False Positive Rate: {false_positive_rate:.2%}")
    print(f"False Negative Rate: {false_negative_rate:.2%}")


if __name__ == "__main__":
    main()
