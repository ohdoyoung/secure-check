from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from pathlib import Path


LOCAL_SEMGREP_RULES = """
rules:
  - id: chwiyakhaenne.node-command-injection
    languages: [javascript, typescript]
    severity: ERROR
    message: User-controlled data flows into child_process.exec.
    metadata:
      cwe: "CWE-78"
    pattern: exec("..." + $VALUE)
  - id: chwiyakhaenne.node-sql-injection
    languages: [javascript, typescript]
    severity: ERROR
    message: User-controlled data is concatenated into a SQL query.
    metadata:
      cwe: "CWE-89"
    pattern: $DB.query("..." + $VALUE)
"""

VULNERABLE_NODE_SAMPLE = """
import { exec } from "child_process";

export async function search(req, res) {
  const rows = await db.query("SELECT * FROM users WHERE id=" + req.query.id);
  exec("ping " + req.query.host);
  res.json(rows);
}
"""


def map_semgrep_rule_id(check_id: str, path: str) -> str:
    normalized = check_id.lower()
    lowered_path = path.lower()
    if "sql" in normalized and "injection" in normalized:
        if lowered_path.endswith(".java"):
            return "JAVA_SQLI_001"
        if lowered_path.endswith(".py"):
            return "PY_SQLI_001"
        if lowered_path.endswith(".php"):
            return "PHP_SQLI_001"
        return "NODE_SQLI_001"
    if "command" in normalized and "injection" in normalized:
        if lowered_path.endswith(".java"):
            return "JAVA_CMDI_001"
        if lowered_path.endswith(".py"):
            return "PY_CMDI_001"
        if lowered_path.endswith(".php"):
            return "PHP_CMDI_001"
        return "NODE_CMDI_001"
    if "xss" in normalized:
        return "NODE_XSS_001"
    if "ssrf" in normalized:
        return "GEN_SSRF_001"
    return f"SEMGREP:{check_id}"


def run_semgrep_smoke() -> dict[str, object]:
    semgrep = shutil.which("semgrep")
    if not semgrep:
        return {
            "available": False,
            "status": "skipped",
            "reason": "semgrep CLI not found",
            "findingCount": 0,
            "mappedRuleIds": [],
        }

    with tempfile.TemporaryDirectory(prefix="chwiyakhaenne-semgrep-smoke-") as temp_dir:
        workspace = Path(temp_dir)
        rule_path = workspace / "rules.yml"
        source_path = workspace / "src" / "app.js"
        source_path.parent.mkdir(parents=True, exist_ok=True)
        rule_path.write_text(LOCAL_SEMGREP_RULES, encoding="utf-8")
        source_path.write_text(VULNERABLE_NODE_SAMPLE, encoding="utf-8")

        completed = subprocess.run(
            [semgrep, "--json", "--config", str(rule_path), str(workspace / "src")],
            check=False,
            capture_output=True,
            text=True,
            timeout=60,
        )

    if completed.returncode not in (0, 1):
        return {
            "available": True,
            "status": "failed",
            "returnCode": completed.returncode,
            "stderr": completed.stderr.strip()[-500:],
            "findingCount": 0,
            "mappedRuleIds": [],
        }

    payload = json.loads(completed.stdout or "{}")
    results = payload.get("results", [])
    mapped = sorted(
        {
            map_semgrep_rule_id(result.get("check_id", "semgrep"), result.get("path", "app.js"))
            for result in results
        }
    )
    return {
        "available": True,
        "status": "passed",
        "returnCode": completed.returncode,
        "findingCount": len(results),
        "checkIds": sorted({result.get("check_id", "semgrep") for result in results}),
        "mappedRuleIds": mapped,
    }


def main() -> None:
    print(json.dumps(run_semgrep_smoke(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
