from tests.benchmark_cases import BENCHMARK_CASES
from tests.benchmark_cases import calculate_benchmark_metrics


def test_benchmark_cases_have_labels():
    positive_cases = [case for case in BENCHMARK_CASES if case.case_type == "positive"]
    negative_cases = [case for case in BENCHMARK_CASES if case.case_type == "negative"]

    assert len(positive_cases) >= 5
    assert len(negative_cases) >= 5
    assert all(case.expected_rules for case in positive_cases)
    assert all(case.forbidden_rules for case in negative_cases)


def test_benchmark_detection_metrics_are_clean_for_labeled_scope():
    metrics = calculate_benchmark_metrics()

    assert metrics["falseNegative"] == 0
    assert metrics["falsePositive"] == 0
    assert metrics["recall"] >= 0.95
    assert metrics["precision"] >= 0.95
    assert metrics["falsePositiveRate"] <= 0.05
