"""Regex runner for the multi-language secure-coding catalog.

The Spring analyzer uses the same JSON catalog through CatalogSecurityRule.
This Python runner keeps the catalog testable without starting the backend.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


DEFAULT_RULE_PATH = Path(__file__).resolve().parents[1] / "rules" / "secure_coding_rules.json"


@dataclass(frozen=True)
class CatalogFinding:
    rule_id: str
    title: str
    severity: str
    cwe: str
    snippet: str


def load_rules(rule_path: Path | str = DEFAULT_RULE_PATH) -> list[dict[str, Any]]:
    path = Path(rule_path)
    with path.open(encoding="utf-8") as rule_file:
        rules = json.load(rule_file)
    return sorted(rules, key=lambda rule: rule["rule_id"])


def analyze_source(source: str, rules: list[dict[str, Any]] | None = None) -> list[CatalogFinding]:
    active_rules = rules if rules is not None else load_rules()
    findings: list[CatalogFinding] = []

    for rule in active_rules:
        for pattern in rule.get("detectPatterns", []):
            for match in re.finditer(pattern, source, flags=re.MULTILINE):
                if _is_safe_match(rule, source, match):
                    continue
                findings.append(
                    CatalogFinding(
                        rule_id=rule["rule_id"],
                        title=rule["title"],
                        severity=rule["severity"],
                        cwe=rule["cwe"],
                        snippet=_line_at_offset(source, match.start()).strip(),
                    )
                )
                break
            if findings and findings[-1].rule_id == rule["rule_id"]:
                break

    return findings


def analyze_rule_example(rule: dict[str, Any], example_key: str) -> list[CatalogFinding]:
    return analyze_source(rule[example_key], [rule])


def _is_safe_match(rule: dict[str, Any], source: str, match: re.Match[str]) -> bool:
    evidence = "\n".join(
        part
        for part in (match.group(0), _line_at_offset(source, match.start()))
        if part
    )
    return any(re.search(pattern, evidence, flags=re.MULTILINE) for pattern in rule.get("safePatterns", []))


def _line_at_offset(source: str, offset: int) -> str:
    start = source.rfind("\n", 0, offset) + 1
    end = source.find("\n", offset)
    if end == -1:
        end = len(source)
    return source[start:end]
