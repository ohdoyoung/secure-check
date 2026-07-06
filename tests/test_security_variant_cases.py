from backend.analyzer.catalog_security_analyzer import analyze_source, load_rules


def rule_by_id(rule_id: str) -> dict:
    rules = {rule["rule_id"]: rule for rule in load_rules()}
    return rules[rule_id]


POSITIVE_VARIANTS = [
    (
        "JAVA_SQLI_001",
        """
        String name = request.getParameter("name");
        Statement st = conn.createStatement();
        st.executeUpdate("DELETE FROM users WHERE name='" + name + "'");
        """,
    ),
    (
        "JAVA_SSRF_001",
        """
        String endpoint = request.getParameter("endpoint");
        HttpClient client = HttpClient.newHttpClient();
        client.send(HttpRequest.newBuilder(URI.create(endpoint)).build(), BodyHandlers.ofString());
        """,
    ),
    ("JAVA_CSRF_001", "http.csrf(AbstractHttpConfigurer::disable);"),
    ("JAVA_TLS_001", "builder.setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE);"),
    ("JAVA_CORS_001", "configuration.addAllowedOrigin(\"*\");"),
    ("JAVA_LOG_001", "logger.error(\"authorization token={}\", authorizationToken);"),
    (
        "PY_SQLI_001",
        """
        username = request.args.get('username')
        cursor.execute("SELECT * FROM users WHERE name='" + username + "'")
        """,
    ),
    (
        "PY_SSRF_001",
        """
        endpoint = request.args.get('endpoint')
        return httpx.get(endpoint).text
        """,
    ),
    (
        "PY_PATH_001",
        """
        filename = request.args.get('name')
        return send_file('/srv/downloads/' + filename)
        """,
    ),
    (
        "PY_XSS_001",
        """
        template = request.args.get('template')
        return render_template_string(template)
        """,
    ),
    ("PY_TLS_001", "response = httpx.post(api_url, verify=False)"),
    (
        "PHP_SQLI_001",
        """
        $name = $_POST['name'];
        $db->query("SELECT * FROM users WHERE name='$name'");
        """,
    ),
    ("PHP_DESER_001", "$state = unserialize($_COOKIE['state']);"),
    ("PHP_TLS_001", "curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);"),
    ("PHP_WEAK_HASH_001", "$digest = sha1($password);"),
    (
        "NODE_SQLI_001",
        """
        const name = req.body.name;
        await connection.query("UPDATE users SET name='" + name + "'");
        """,
    ),
    ("NODE_PATH_001", "fs.createReadStream(req.query.path).pipe(res);"),
    (
        "NODE_SESSION_COOKIE_001",
        "app.use(session({ secret: 'keyboard-cat', cookie: { httpOnly: false } }));",
    ),
    ("NODE_CSRF_001", "router.delete('/admin/item', (req, res) => deleteItem(req.body.id));"),
    ("NODE_HEADER_INJECTION_001", "response.header('X-Next', request.body.next);"),
    ("REACT_TARGET_BLANK_001", "return <a target=\"_blank\" href={profileUrl}>profile</a>;"),
    ("REACT_JAVASCRIPT_URL_001", "return <a href=\"javascript:alert(1)\">run</a>;"),
    (
        "GEN_CSP_UNSAFE_INLINE_001",
        "res.setHeader('Content-Security-Policy', \"default-src 'self'; script-src 'unsafe-inline'\");",
    ),
    ("GEN_DOCKER_SECRET_ENV_001", "ARG GITHUB_TOKEN=ghp_123456789abcdef"),
    ("GEN_K8S_PRIVILEGED_001", "securityContext:\n  privileged: true"),
    ("GEN_DEPENDENCY_HTTP_001", "\"index-url\": \"http://pypi.example.local/simple\""),
    ("SQL_PUBLIC_GRANT_001", "GRANT UPDATE ON appdb.* TO 'app'@'%';"),
    ("SQL_WEAK_PASSWORD_001", "ALTER USER 'app'@'%' IDENTIFIED BY 'changeme';"),
]

NEGATIVE_VARIANTS = [
    (
        "JAVA_SQLI_001",
        """
        PreparedStatement ps = conn.prepareStatement("DELETE FROM users WHERE name=?");
        ps.setString(1, name);
        ps.executeUpdate();
        """,
    ),
    ("JAVA_CSRF_001", "http.csrf(csrf -> csrf.csrfTokenRepository(repo));"),
    ("PY_TLS_001", "response = requests.get(api_url, verify=True, timeout=3)"),
    ("PY_PATH_001", "filename = secure_filename(request.args.get('name'))\nreturn send_file(safe_join('/srv/downloads', filename))"),
    ("PHP_DESER_001", "$data = json_decode($_POST['payload'], true, flags: JSON_THROW_ON_ERROR);"),
    ("NODE_SESSION_COOKIE_001", "app.use(session({ secret: process.env.SESSION_SECRET, cookie: { secure: true, httpOnly: true, sameSite: 'lax' } }));"),
    ("NODE_CSRF_001", "router.delete('/admin/item', csrfProtection, (req, res) => deleteItem(req.body.id));"),
    ("REACT_TARGET_BLANK_001", "return <a target=\"_blank\" rel=\"noopener noreferrer\" href={profileUrl}>profile</a>;"),
    ("GEN_DOCKER_ROOT_001", "FROM node:20\nUSER node\nCMD [\"node\", \"server.js\"]"),
    ("GEN_K8S_PRIVILEGED_001", "securityContext:\n  privileged: false\n  allowPrivilegeEscalation: false"),
    ("GEN_DEPENDENCY_HTTP_001", "\"registry\": \"https://registry.npmjs.org/\""),
    ("SQL_PRIV_001", "GRANT SELECT, INSERT ON appdb.orders TO 'app'@'10.%';"),
    ("GEN_SECRET_001", "const API_KEY = process.env.API_KEY;"),
]


def test_positive_variant_cases_are_detected():
    missed = []

    for rule_id, source in POSITIVE_VARIANTS:
        findings = analyze_source(source, [rule_by_id(rule_id)])
        detected_ids = {finding.rule_id for finding in findings}
        if rule_id not in detected_ids:
            missed.append(rule_id)

    assert not missed


def test_negative_variant_cases_are_not_detected_by_own_rule():
    false_positives = []

    for rule_id, source in NEGATIVE_VARIANTS:
        findings = analyze_source(source, [rule_by_id(rule_id)])
        detected_ids = {finding.rule_id for finding in findings}
        if rule_id in detected_ids:
            false_positives.append(rule_id)

    assert not false_positives
