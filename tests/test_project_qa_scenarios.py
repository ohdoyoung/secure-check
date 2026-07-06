from backend.analyzer.catalog_security_analyzer import analyze_source as analyze_catalog_source
from backend.analyzer.catalog_security_analyzer import load_rules as load_catalog_rules
from backend.analyzer.kisa_js_analyzer import analyze_source as analyze_kisa_source
from backend.analyzer.kisa_js_analyzer import load_rules as load_kisa_rules


CATALOG_RULES = load_catalog_rules()
KISA_RULES = load_kisa_rules()


VULNERABLE_PROJECT = {
    "backend/src/main/java/com/example/UserController.java": """
        String id = request.getParameter("id");
        Statement statement = connection.createStatement();
        ResultSet rs = statement.executeQuery("SELECT * FROM users WHERE id='" + id + "'");
        response.getWriter().write("<h1>" + request.getParameter("name") + "</h1>");
        logger.info("authorization token={}", authorizationToken);
    """,
    "backend/src/main/java/com/example/SecurityConfig.java": """
        http.csrf().disable();
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("*");
        builder.setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE);
        Object bean = new InitialContext().lookup("ldap://" + request.getParameter("jndi"));
    """,
    "frontend/src/routes/admin.tsx": """
        import express from "express";
        import session from "express-session";
        import helmet from "helmet";
        import { createReadStream } from "fs";

        const router = express.Router();
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        const apiKey = "sk_live_real_secret_123456789";

        app.use(helmet({ contentSecurityPolicy: false }));
        router.use(session({ secret: "keyboard-cat", cookie: { httpOnly: false } }));
        router.delete("/admin/users/:id", (req, res) => removeUser(req.params.id));
        router.get("/download", (req, res) => createReadStream(req.query.path).pipe(res));
        router.get("/profile", (req, res) => res.send(req.query.bio));

        export function Link({ href }) {
          return <a target="_blank" href="javascript:alert(1)">open</a>;
        }
    """,
    "services/report.py": """
        user_id = request.args.get("id")
        cursor.execute("SELECT * FROM reports WHERE id='" + user_id + "'")
        endpoint = request.args.get("endpoint")
        return httpx.get(endpoint).text
        response = requests.get(admin_url, verify=False)
        parser = etree.XMLParser(resolve_entities=True)
        tmp_path = tempfile.mktemp()
    """,
    "public/index.php": """
        extract($_REQUEST);
        $name = $_POST['name'];
        $db->query("SELECT * FROM users WHERE name='$name'");
        echo '<p>' . $_GET['msg'] . '</p>';
        $state = unserialize($_COOKIE['state']);
        $hash = sha1($password);
    """,
    "infra/Dockerfile": """
        FROM node:20
        ARG GITHUB_TOKEN=ghp_123456789abcdef
        USER root
    """,
    "infra/deployment.yaml": """
        containers:
          - name: app
            securityContext:
              privileged: true
        automountServiceAccountToken: true
    """,
    "nginx/security.conf": """
        proxy_ssl_verify off;
    """,
    "infra/main.tf": """
        resource "aws_security_group" "admin" {
          ingress {
            from_port = 22
            to_port = 22
            cidr_blocks = ["0.0.0.0/0"]
          }
        }
    """,
    "package.json": """
        {
          "repository": "http://packages.internal.example/repository/npm"
        }
    """,
}


EXPECTED_PROJECT_RULES = {
    "JAVA_SQLI_001",
    "JAVA_XSS_001",
    "JAVA_LOG_001",
    "JAVA_CSRF_001",
    "JAVA_CORS_001",
    "JAVA_TLS_001",
    "JAVA_JNDI_LOOKUP_001",
    "GEN_SECRET_001",
    "NODE_SESSION_COOKIE_001",
    "NODE_HELMET_DISABLED_001",
    "NODE_CSRF_001",
    "NODE_PATH_001",
    "NODE_XSS_001",
    "NODE_TLS_ENV_001",
    "REACT_TARGET_BLANK_001",
    "REACT_JAVASCRIPT_URL_001",
    "PY_SQLI_001",
    "PY_SSRF_001",
    "PY_TLS_001",
    "PY_XML_XXE_001",
    "PY_TEMPFILE_MKTEMP_001",
    "PHP_SQLI_001",
    "PHP_XSS_001",
    "PHP_DESER_001",
    "PHP_WEAK_HASH_001",
    "PHP_EXTRACT_OVERWRITE_001",
    "GEN_DOCKER_SECRET_ENV_001",
    "GEN_DOCKER_ROOT_001",
    "GEN_K8S_PRIVILEGED_001",
    "GEN_K8S_AUTOMOUNT_TOKEN_001",
    "GEN_NGINX_PROXY_SSL_VERIFY_OFF_001",
    "GEN_TERRAFORM_PUBLIC_SG_001",
    "GEN_DEPENDENCY_HTTP_001",
    "JS-KISA-004",
    "JS-KISA-008",
    "JS-KISA-020",
    "JS-KISA-024",
}


SAFE_PROJECT = {
    "backend/src/main/java/com/example/UserController.java": """
        PreparedStatement ps = connection.prepareStatement("SELECT * FROM users WHERE id=?");
        ps.setString(1, id);
        response.getWriter().write("<h1>" + Encode.forHtml(name) + "</h1>");
        logger.info("profile requested userId={}", userId);
    """,
    "backend/src/main/java/com/example/SecurityConfig.java": """
        http.csrf(csrf -> csrf.csrfTokenRepository(repo));
        config.setAllowedOrigins(List.of("https://app.example.com"));
        builder.setEndpointIdentificationAlgorithm("HTTPS");
    """,
    "frontend/src/routes/admin.tsx": """
        import DOMPurify from "dompurify";
        import session from "express-session";

        const router = express.Router();
        const apiKey = process.env.API_KEY;
        router.use(session({
          secret: process.env.SESSION_SECRET,
          cookie: { secure: true, httpOnly: true, sameSite: "lax" }
        }));
        router.delete("/admin/users/:id", csrfProtection, requireAdmin, (req, res) => removeUser(req.params.id));
        const clean = DOMPurify.sanitize(profileHtml);
        export function Link({ href }) {
          return <a target="_blank" rel="noopener noreferrer" href={href}>open</a>;
        }
    """,
    "services/report.py": """
        cursor.execute("SELECT * FROM reports WHERE id=%s", (user_id,))
        parsed = urlparse(endpoint)
        if parsed.hostname not in allowed_hosts:
            abort(400)
        response = requests.get(admin_url, verify=True)
    """,
    "public/index.php": """
        $stmt = $pdo->prepare('SELECT * FROM users WHERE name = ?');
        $stmt->execute([$_POST['name']]);
        echo '<p>' . htmlspecialchars($_GET['msg'], ENT_QUOTES, 'UTF-8') . '</p>';
        $state = json_decode($_COOKIE['state'], true, flags: JSON_THROW_ON_ERROR);
        $hash = password_hash($password, PASSWORD_ARGON2ID);
    """,
    "infra/Dockerfile": """
        FROM node:20
        USER node
    """,
    "infra/deployment.yaml": """
        containers:
          - name: app
            securityContext:
              privileged: false
            allowPrivilegeEscalation: false
            automountServiceAccountToken: false
    """,
    "nginx/security.conf": """
        proxy_ssl_verify on;
        proxy_ssl_trusted_certificate /etc/nginx/ca.pem;
    """,
    "infra/main.tf": """
        resource "aws_security_group" "admin" {
          ingress {
            from_port = 22
            to_port = 22
            cidr_blocks = [var.office_cidr]
          }
        }
    """,
    "package.json": """
        {
          "repository": "https://registry.npmjs.org/"
        }
    """,
}


FORBIDDEN_SAFE_RULES = {
    "JAVA_SQLI_001",
    "JAVA_XSS_001",
    "JAVA_LOG_001",
    "JAVA_CSRF_001",
    "JAVA_CORS_001",
    "JAVA_TLS_001",
    "GEN_SECRET_001",
    "NODE_SESSION_COOKIE_001",
    "NODE_CSRF_001",
    "NODE_XSS_001",
    "REACT_TARGET_BLANK_001",
    "PY_SQLI_001",
    "PY_SSRF_001",
    "PY_TLS_001",
    "PHP_SQLI_001",
    "PHP_XSS_001",
    "PHP_DESER_001",
    "PHP_WEAK_HASH_001",
    "GEN_DOCKER_ROOT_001",
    "GEN_K8S_PRIVILEGED_001",
    "GEN_K8S_AUTOMOUNT_TOKEN_001",
    "GEN_NGINX_PROXY_SSL_VERIFY_OFF_001",
    "GEN_TERRAFORM_PUBLIC_SG_001",
    "GEN_DEPENDENCY_HTTP_001",
    "JS-KISA-004",
    "JS-KISA-008",
    "JS-KISA-024",
}


def analyze_project(files: dict[str, str]) -> set[str]:
    detected: set[str] = set()
    for path, source in files.items():
        detected.update(finding.rule_id for finding in analyze_catalog_source(source, CATALOG_RULES))
        if path.endswith((".js", ".jsx", ".ts", ".tsx")):
            detected.update(finding.rule_id for finding in analyze_kisa_source(source, path, KISA_RULES))
    return detected


def test_vulnerable_mini_project_detects_expected_rule_set():
    detected = analyze_project(VULNERABLE_PROJECT)
    missing = EXPECTED_PROJECT_RULES - detected

    assert not missing


def test_safe_mini_project_does_not_trigger_core_security_rules():
    detected = analyze_project(SAFE_PROJECT)
    unexpected = FORBIDDEN_SAFE_RULES & detected

    assert not unexpected
