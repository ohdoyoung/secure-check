"""KISA JavaScript secure-coding rule runner for the portfolio benchmark.

The production Spring analyzer can call this module later through an external
adapter. For the first rule-set milestone, this runner keeps KISA mapping,
regex rules, AST-like call/member signals, samples, and metrics testable.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable


DEFAULT_RULE_PATH = Path(__file__).resolve().parents[1] / "rules" / "kisa_js_rules.json"
SUPPORTED_SUFFIXES = {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"}


@dataclass(frozen=True)
class Finding:
    rule_id: str
    title: str
    severity: str
    cwe: str
    file_path: str
    line: int
    snippet: str
    detection_type: str
    recommendation: str


def load_rules(rule_path: Path | str = DEFAULT_RULE_PATH) -> list[dict[str, Any]]:
    path = Path(rule_path)
    with path.open(encoding="utf-8") as rule_file:
        rules = json.load(rule_file)
    return sorted(rules, key=lambda rule: rule["id"])


def analyze_path(path: Path | str, rules: list[dict[str, Any]] | None = None) -> list[Finding]:
    source_path = Path(path)
    return analyze_source(
        source_path.read_text(encoding="utf-8"),
        file_path=str(source_path),
        rules=rules,
    )


def analyze_source(
    source: str,
    file_path: str = "inline.js",
    rules: list[dict[str, Any]] | None = None,
) -> list[Finding]:
    active_rules = rules if rules is not None else load_rules()
    normalized = _strip_comments_preserve_lines(source)
    signals = extract_ast_signals(normalized)
    findings: list[Finding] = []

    for rule in active_rules:
        source_for_rule = source if rule.get("includeComments") else normalized
        if not _has_required_signal(rule, signals):
            continue
        for pattern in rule.get("detectPatterns", []):
            for match in re.finditer(pattern, source_for_rule, flags=re.MULTILINE):
                if _is_safe_match(rule, source_for_rule, match):
                    continue
                findings.append(_finding_from_match(rule, file_path, source_for_rule, match))
                break
            if findings and findings[-1].rule_id == rule["id"]:
                break

    return _deduplicate(findings)


def extract_ast_signals(source: str) -> set[str]:
    """Extract lightweight AST-style signals without requiring node packages.

    This is intentionally small: it does not replace a real JavaScript parser,
    but it gives the rule runner a parser-adapter seam for future Babel, Acorn,
    Semgrep, or CodeQL integration.
    """

    signals: set[str] = set()
    if re.search(r"\bdebugger\s*;", source):
        signals.add("keyword:debugger")

    for call_name in re.findall(r"\b([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(", source):
        signals.add(f"call:{call_name}")
        if "." in call_name:
            signals.add(f"call:{call_name.rsplit('.', 1)[-1]}")

    for member_name in re.findall(r"\.([A-Za-z_$][\w$]*)\b", source):
        signals.add(f"member:{member_name}")

    for assignment_name in re.findall(r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=", source):
        signals.add(f"assignment:{assignment_name}")

    return signals


def iter_js_files(paths: Iterable[Path | str]) -> list[Path]:
    files: list[Path] = []
    for raw_path in paths:
        path = Path(raw_path)
        if path.is_dir():
            files.extend(
                child
                for child in path.rglob("*")
                if child.is_file() and child.suffix.lower() in SUPPORTED_SUFFIXES
            )
        elif path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES:
            files.append(path)
    return sorted(files)


def _has_required_signal(rule: dict[str, Any], signals: set[str]) -> bool:
    required = set(rule.get("astSignals") or [])
    return not required or bool(required.intersection(signals))


def _is_safe_match(rule: dict[str, Any], source: str, match: re.Match[str]) -> bool:
    evidence = "\n".join(
        part
        for part in (match.group(0), _line_at_offset(source, match.start()))
        if part
    )
    return any(re.search(pattern, evidence, flags=re.MULTILINE) for pattern in rule.get("safePatterns", []))


def _finding_from_match(rule: dict[str, Any], file_path: str, source: str, match: re.Match[str]) -> Finding:
    snippet = _line_at_offset(source, match.start()).strip()
    return Finding(
        rule_id=rule["id"],
        title=rule["title"],
        severity=rule["severity"],
        cwe=rule["cwe"],
        file_path=file_path,
        line=source.count("\n", 0, match.start()) + 1,
        snippet=snippet,
        detection_type=rule["detectionType"],
        recommendation=rule["recommendation"],
    )


def _line_at_offset(source: str, offset: int) -> str:
    start = source.rfind("\n", 0, offset) + 1
    end = source.find("\n", offset)
    if end == -1:
        end = len(source)
    return source[start:end]


def _deduplicate(findings: list[Finding]) -> list[Finding]:
    seen: set[tuple[str, str, int]] = set()
    unique: list[Finding] = []
    for finding in findings:
        key = (finding.rule_id, finding.file_path, finding.line)
        if key not in seen:
            seen.add(key)
            unique.append(finding)
    return sorted(unique, key=lambda item: (item.file_path, item.line, item.rule_id))


def _strip_comments_preserve_lines(source: str) -> str:
    def replace(match: re.Match[str]) -> str:
        return "\n" * match.group(0).count("\n")

    return re.sub(r"(?<!:)//.*?$|/\*.*?\*/", replace, source, flags=re.MULTILINE | re.DOTALL)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run KISA JavaScript MVP rules against JS/TS files.")
    parser.add_argument("paths", nargs="+", help="Files or directories to scan")
    parser.add_argument("--rules", default=str(DEFAULT_RULE_PATH), help="Path to kisa_js_rules.json")
    args = parser.parse_args()

    rules = load_rules(args.rules)
    results: list[dict[str, Any]] = []
    for js_file in iter_js_files(args.paths):
        results.extend(asdict(finding) for finding in analyze_path(js_file, rules))

    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 1 if results else 0


if __name__ == "__main__":
    raise SystemExit(main())
