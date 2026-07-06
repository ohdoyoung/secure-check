from backend.analyzer.catalog_security_analyzer import analyze_source as analyze_catalog_source
from backend.analyzer.catalog_security_analyzer import load_rules as load_catalog_rules
from backend.analyzer.kisa_js_analyzer import analyze_source as analyze_kisa_source
from backend.analyzer.kisa_js_analyzer import load_rules as load_kisa_rules


def catalog_rule(rule_id: str) -> dict:
    return {rule["rule_id"]: rule for rule in load_catalog_rules()}[rule_id]


def kisa_rule(rule_id: str) -> dict:
    return {rule["id"]: rule for rule in load_kisa_rules()}[rule_id]


CATALOG_MIXED_SAFE_AND_UNSAFE = [
    (
        "GEN_SECRET_001",
        """
        const SAMPLE_API_KEY = "placeholder";
        const API_KEY = "sk_live_real_secret_123456789";
        """,
    ),
    (
        "NODE_SQLI_001",
        """
        await db.query("SELECT * FROM users WHERE id = ?", [safeId]);
        await db.query("SELECT * FROM users WHERE email='" + req.query.email + "'");
        """,
    ),
    (
        "NODE_XSS_001",
        """
        import escapeHtml from "escape-html";
        res.send("<p>" + escapeHtml(req.query.name) + "</p>");
        res.send(req.query.bio);
        """,
    ),
    (
        "PY_TLS_001",
        """
        requests.get(public_url, verify=True)
        requests.get(admin_url, verify=False)
        """,
    ),
    (
        "GEN_DOCKER_ROOT_001",
        """
        FROM node:20
        USER node
        RUN npm ci
        USER root
        RUN apk add curl
        """,
    ),
    (
        "GEN_K8S_PRIVILEGED_001",
        """
        containers:
          - name: safe-worker
            securityContext:
              privileged: false
          - name: risky-worker
            securityContext:
              privileged: true
        """,
    ),
    (
        "GEN_DEPENDENCY_HTTP_001",
        """
        {
          "registry": "https://registry.npmjs.org/",
          "repository": "http://packages.internal.example/repository/npm"
        }
        """,
    ),
]


KISA_MIXED_SAFE_AND_UNSAFE = [
    (
        "JS-KISA-001",
        """
        await db.query("SELECT * FROM users WHERE id = ?", [safeId]);
        await db.query("SELECT * FROM users WHERE id=" + req.query.id);
        """,
    ),
    (
        "JS-KISA-004",
        """
        res.send("<p>" + escapeHtml(req.query.name) + "</p>");
        res.send(req.query.profile);
        """,
    ),
    (
        "JS-KISA-008",
        """
        const jwtSecret = process.env.JWT_SECRET;
        const apiKey = "sk_live_real_secret_123456789";
        """,
    ),
    (
        "JS-KISA-024",
        """
        const safeAgent = new https.Agent({ rejectUnauthorized: true });
        const debugAgent = new https.Agent({ rejectUnauthorized: false });
        """,
    ),
]


def test_catalog_safe_code_does_not_hide_later_vulnerability():
    missed = []

    for rule_id, source in CATALOG_MIXED_SAFE_AND_UNSAFE:
        findings = analyze_catalog_source(source, [catalog_rule(rule_id)])
        if rule_id not in {finding.rule_id for finding in findings}:
            missed.append(rule_id)

    assert not missed


def test_kisa_safe_code_does_not_hide_later_vulnerability():
    missed = []

    for rule_id, source in KISA_MIXED_SAFE_AND_UNSAFE:
        findings = analyze_kisa_source(source, rules=[kisa_rule(rule_id)])
        if rule_id not in {finding.rule_id for finding in findings}:
            missed.append(rule_id)

    assert not missed
