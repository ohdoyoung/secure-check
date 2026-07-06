"""Future Python rule draft for SQL Injection detection.

The running MVP uses Java rules under src/main/java/com/chwiyakhaenne/analyzer/rules.
This file documents the planned external-rule shape for a Semgrep-like adapter.
"""

RULE_ID = "sql-injection"
SEVERITY = "HIGH"
PATTERNS = [
    "statement.execute(",
    "executeQuery(",
    "cursor.execute(",
    "db.query(",
]


def metadata():
    return {
        "title": "SQL Injection 의심",
        "recommendation": "PreparedStatement 또는 바인딩 파라미터를 사용하세요.",
    }
