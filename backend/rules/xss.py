"""Future Python rule draft for XSS detection."""

RULE_ID = "xss"
SEVERITY = "MEDIUM"
PATTERNS = [
    "innerHTML",
    "outerHTML",
    "document.write(",
    "dangerouslySetInnerHTML",
]


def metadata():
    return {
        "title": "XSS 가능성",
        "recommendation": "HTML 직접 주입을 피하고 sanitizer를 적용하세요.",
    }
