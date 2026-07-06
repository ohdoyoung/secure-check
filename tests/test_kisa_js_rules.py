from __future__ import annotations

from pathlib import Path

from backend.analyzer.kisa_js_analyzer import analyze_path, load_rules
from tests.kisa_js_metrics import (
    KISA_JS_TOTAL_ITEMS,
    NEGATIVE_DIR,
    POSITIVE_DIR,
    REQUESTED_RULE_TOTAL,
    calculate_metrics,
    expected_rule_id,
    sample_files,
)


REQUESTED_RULE_IDS = {f"JS-KISA-{index:03d}" for index in range(1, 33)}
ADDITIONAL_RULE_IDS = {f"JS-OWASP-{index:03d}" for index in range(1, 12)}
ADDITIONAL_POSITIVE_DIR = Path("tests/samples/additional/positive")
ADDITIONAL_NEGATIVE_DIR = Path("tests/samples/additional/negative")


def detected_rule_ids(path: Path) -> set[str]:
    return {finding.rule_id for finding in analyze_path(path)}


def test_rule_catalog_contains_requested_kisa_js_rules() -> None:
    rules = load_rules()
    rule_ids = {rule["id"] for rule in rules}
    assert REQUESTED_RULE_IDS.issubset(rule_ids)
    assert ADDITIONAL_RULE_IDS.issubset(rule_ids)

    for rule in [rule for rule in rules if rule["id"].startswith("JS-KISA-")]:
        assert rule["kisaReference"] == "JavaScript 시큐어코딩 가이드 2023"
        assert rule["detectionType"] == "AST + Regex"
        assert rule["detectPatterns"]
        assert rule["safePatterns"] is not None


def test_positive_samples_detect_expected_rule() -> None:
    positive_files = sample_files(POSITIVE_DIR)
    assert len(positive_files) == REQUESTED_RULE_TOTAL

    for path in positive_files:
        expected = expected_rule_id(path)
        assert expected in detected_rule_ids(path), f"{path.name} did not trigger {expected}"


def test_negative_samples_are_not_detected() -> None:
    negative_files = sample_files(NEGATIVE_DIR)
    assert len(negative_files) == REQUESTED_RULE_TOTAL

    for path in negative_files:
        findings = analyze_path(path)
        assert findings == [], f"{path.name} produced false positives: {findings}"


def test_owasp_additional_samples_detect_expected_rule() -> None:
    positive_files = sorted(ADDITIONAL_POSITIVE_DIR.glob("*.js"))
    assert len(positive_files) == len(ADDITIONAL_RULE_IDS)

    for path in positive_files:
        expected = path.name[:12]
        assert expected in detected_rule_ids(path), f"{path.name} did not trigger {expected}"


def test_owasp_additional_negative_samples_are_not_detected() -> None:
    negative_files = sorted(ADDITIONAL_NEGATIVE_DIR.glob("*.js"))
    assert len(negative_files) == len(ADDITIONAL_RULE_IDS)

    for path in negative_files:
        findings = analyze_path(path)
        assert findings == [], f"{path.name} produced false positives: {findings}"


def test_kisa_metrics_are_calculated_from_samples() -> None:
    metrics = calculate_metrics()
    assert metrics["kisaTotalItems"] == KISA_JS_TOTAL_ITEMS
    assert metrics["implementedRuleCount"] == REQUESTED_RULE_TOTAL
    assert metrics["kisaCoverage"] == 0.7619
    assert metrics["testSampleCount"] == 64
    assert metrics["precision"] == 1.0
    assert metrics["recall"] == 1.0
    assert metrics["falsePositiveRate"] == 0.0
    assert metrics["falseNegativeRate"] == 0.0
