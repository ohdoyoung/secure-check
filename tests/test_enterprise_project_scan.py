from backend.analyzer.catalog_security_analyzer import analyze_source as analyze_catalog_source
from backend.analyzer.catalog_security_analyzer import load_rules as load_catalog_rules
from backend.analyzer.kisa_js_analyzer import analyze_source as analyze_kisa_source
from backend.analyzer.kisa_js_analyzer import load_rules as load_kisa_rules
from tests.test_realistic_vulnerable_flows import REALISTIC_VULNERABLE_SCENARIOS


CATALOG_RULES = load_catalog_rules()
KISA_RULES = load_kisa_rules()


SAFE_FILES = {
    "apps/api/src/health.ts": """
        app.get('/health', requireAuth, (req, res) => {
          res.json({ status: 'ok' });
        });
    """,
    "backend/src/main/java/com/example/SafeRepository.java": """
        PreparedStatement ps = connection.prepareStatement("SELECT * FROM users WHERE id=?");
        ps.setString(1, id);
        ResultSet rs = ps.executeQuery();
    """,
    "infra/safe-deployment.yaml": """
        containers:
          - name: api
            image: ghcr.io/acme/api:1.4.2
            securityContext:
              runAsNonRoot: true
              allowPrivilegeEscalation: false
              privileged: false
    """,
}


def enterprise_project_files() -> dict[str, str]:
    files: dict[str, str] = {}
    for scenario_name, scenario_files, _ in REALISTIC_VULNERABLE_SCENARIOS:
        for path, source in scenario_files.items():
            files[f"enterprise/{scenario_name}/{path}"] = source
    files.update(SAFE_FILES)
    return files


def expected_enterprise_rules() -> set[str]:
    expected: set[str] = set()
    for _, _, expected_rules in REALISTIC_VULNERABLE_SCENARIOS:
        expected.update(expected_rules)
    return expected


def findings_by_file(files: dict[str, str]) -> dict[str, set[str]]:
    detected: dict[str, set[str]] = {}
    for path, source in files.items():
        rule_ids = {finding.rule_id for finding in analyze_catalog_source(source, CATALOG_RULES)}
        if path.endswith((".js", ".jsx", ".ts", ".tsx")):
            rule_ids.update(finding.rule_id for finding in analyze_kisa_source(source, path, KISA_RULES))
        detected[path] = rule_ids
    return detected


def test_enterprise_project_detects_expected_rule_labels():
    detected_by_file = findings_by_file(enterprise_project_files())
    detected = set().union(*detected_by_file.values())
    missing = expected_enterprise_rules() - detected

    assert not missing


def test_enterprise_project_has_file_level_distribution():
    detected_by_file = findings_by_file(enterprise_project_files())
    vulnerable_files = {
        path: rule_ids
        for path, rule_ids in detected_by_file.items()
        if rule_ids
    }

    assert len(vulnerable_files) >= 10
    assert all(not detected_by_file[path] for path in SAFE_FILES)
    assert any(path.endswith("frontend/src/routes/admin.tsx") for path in vulnerable_files)
    assert any(path.endswith("services/report.py") for path in vulnerable_files)
    assert any(path.endswith("infra/deployment.yaml") for path in vulnerable_files)
