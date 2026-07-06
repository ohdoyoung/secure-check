from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.analyzer.kisa_js_analyzer import analyze_path, load_rules


KISA_JS_TOTAL_ITEMS = 42
REQUESTED_RULE_TOTAL = 32
RULE_ID_PATTERN = re.compile(r"JS-KISA-\d{3}")
POSITIVE_DIR = ROOT / "tests" / "samples" / "positive"
NEGATIVE_DIR = ROOT / "tests" / "samples" / "negative"


def expected_rule_id(path: Path) -> str:
    match = RULE_ID_PATTERN.search(path.name)
    if not match:
        raise ValueError(f"sample file does not include a JS-KISA rule id: {path}")
    return match.group(0)


def sample_files(directory: Path) -> list[Path]:
    return sorted(path for path in directory.glob("*.js") if path.name.startswith("JS-KISA-"))


def calculate_metrics() -> dict[str, Any]:
    rules = [rule for rule in load_rules() if rule["id"].startswith("JS-KISA-")]
    implemented_rule_ids = {rule["id"] for rule in rules}
    positive_files = sample_files(POSITIVE_DIR)
    negative_files = sample_files(NEGATIVE_DIR)

    true_positive = 0
    false_negative = 0
    unexpected_positive_detections = 0
    negative_false_positive_detections = 0
    negative_files_with_findings = 0
    detection_count = 0
    positive_results: dict[str, list[str]] = {}
    negative_results: dict[str, list[str]] = {}

    for path in positive_files:
        expected = expected_rule_id(path)
        detected = [finding.rule_id for finding in analyze_path(path, rules)]
        positive_results[path.name] = detected
        detection_count += len(detected)

        if expected in detected:
            true_positive += 1
        else:
            false_negative += 1

        unexpected_positive_detections += len([rule_id for rule_id in detected if rule_id != expected])

    for path in negative_files:
        detected = [finding.rule_id for finding in analyze_path(path, rules)]
        negative_results[path.name] = detected
        detection_count += len(detected)
        negative_false_positive_detections += len(detected)
        if detected:
            negative_files_with_findings += 1

    false_positive = unexpected_positive_detections + negative_false_positive_detections
    true_negative = len(negative_files) - negative_files_with_findings

    precision_denominator = true_positive + false_positive
    recall_denominator = true_positive + false_negative
    false_positive_denominator = true_negative + negative_files_with_findings

    return {
        "kisaTotalItems": KISA_JS_TOTAL_ITEMS,
        "requestedRuleTotal": REQUESTED_RULE_TOTAL,
        "implementedRuleCount": len(implemented_rule_ids),
        "kisaCoverage": round(len(implemented_rule_ids) / KISA_JS_TOTAL_ITEMS, 4),
        "positiveSampleCount": len(positive_files),
        "negativeSampleCount": len(negative_files),
        "testSampleCount": len(positive_files) + len(negative_files),
        "detectionCount": detection_count,
        "truePositive": true_positive,
        "falsePositive": false_positive,
        "trueNegative": true_negative,
        "falseNegative": false_negative,
        "precision": round(true_positive / precision_denominator, 4) if precision_denominator else 0,
        "recall": round(true_positive / recall_denominator, 4) if recall_denominator else 0,
        "falsePositiveRate": round(negative_files_with_findings / false_positive_denominator, 4)
        if false_positive_denominator
        else 0,
        "falseNegativeRate": round(false_negative / recall_denominator, 4) if recall_denominator else 0,
        "positiveResults": positive_results,
        "negativeResults": negative_results,
    }


def main() -> int:
    print(json.dumps(calculate_metrics(), ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
