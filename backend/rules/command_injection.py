"""Future Python rule draft for command injection detection."""

RULE_ID = "command-injection"
SEVERITY = "HIGH"
PATTERNS = [
    "Runtime.getRuntime().exec(",
    "ProcessBuilder(",
    "child_process.exec(",
    "os.system(",
    "shell=True",
]


def metadata():
    return {
        "title": "Command Injection 의심",
        "recommendation": "명령 실행을 피하고 인자를 allowlist로 제한하세요.",
    }
