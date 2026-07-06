import shutil

import pytest

from tests.semgrep_cli_smoke import run_semgrep_smoke


@pytest.mark.skipif(shutil.which("semgrep") is None, reason="semgrep CLI not installed")
def test_semgrep_cli_smoke_maps_external_findings_to_catalog_rule_ids():
    result = run_semgrep_smoke()

    assert result["status"] == "passed"
    assert result["findingCount"] >= 2
    assert "NODE_CMDI_001" in result["mappedRuleIds"]
    assert "NODE_SQLI_001" in result["mappedRuleIds"]
