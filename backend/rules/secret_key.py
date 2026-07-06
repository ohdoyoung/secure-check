"""Future Python rule draft for hard-coded secret detection."""

RULE_ID = "hardcoded-secret"
SEVERITY = "HIGH"
PATTERNS = [
    "password =",
    "secret =",
    "apiKey =",
    "accessToken =",
    "jwtSecret =",
]


def metadata():
    return {
        "title": "하드코딩된 비밀번호/키",
        "recommendation": "환경 변수나 Secret Manager를 사용하세요.",
    }
