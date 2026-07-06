from __future__ import annotations

from dataclasses import dataclass

from backend.analyzer.catalog_security_analyzer import analyze_source as analyze_catalog_source
from backend.analyzer.catalog_security_analyzer import load_rules as load_catalog_rules
from backend.analyzer.kisa_js_analyzer import analyze_source as analyze_kisa_source
from backend.analyzer.kisa_js_analyzer import load_rules as load_kisa_rules


CATALOG_RULES = load_catalog_rules()
KISA_RULES = load_kisa_rules()


@dataclass(frozen=True)
class BenchmarkCase:
    case_id: str
    case_type: str
    files: dict[str, str]
    expected_rules: set[str]
    forbidden_rules: set[str]


NODE_ACCOUNT_RULES = {
    "GEN_SECRET_001",
    "JS-KISA-008",
    "NODE_JWT_DECODE_001",
    "JS-OWASP-007",
    "NODE_COOKIE_FLAGS_001",
    "NODE_NOSQLI_001",
    "JS-OWASP-006",
    "NODE_SQLI_001",
    "JS-KISA-001",
    "NODE_XSS_001",
    "JS-KISA-004",
    "NODE_CMDI_001",
    "JS-KISA-005",
    "NODE_PROTO_001",
    "JS-OWASP-008",
    "GEN_REDIRECT_001",
    "JS-KISA-016",
}

SPRING_ADMIN_RULES = {
    "JAVA_PERMIT_ALL_001",
    "JAVA_SQLI_001",
    "JAVA_DESER_001",
    "JAVA_CMDI_001",
    "JAVA_PATH_001",
    "JAVA_XSS_001",
}

PYTHON_REPORT_RULES = {
    "PY_DJANGO_ALLOWED_HOSTS_001",
    "PY_DJANGO_COOKIE_SECURE_001",
    "PY_SQLI_001",
    "PY_CMDI_001",
    "PY_PICKLE_001",
    "PY_SSRF_001",
    "PY_TLS_001",
    "GEN_REDIRECT_001",
    "PY_XSS_001",
    "PY_FLASK_DEBUG_001",
}

PHP_PLUGIN_RULES = {
    "PHP_SQLI_001",
    "PHP_XSS_001",
    "PHP_CMDI_001",
    "PHP_FILE_001",
    "PHP_UPLOAD_001",
    "PHP_DESER_001",
    "PHP_WEAK_HASH_001",
    "PHP_TLS_001",
    "PHP_ALLOW_URL_INCLUDE_001",
}

INFRA_PLATFORM_RULES = {
    "GEN_DOCKER_SECRET_ENV_001",
    "GEN_DOCKER_ADD_REMOTE_001",
    "GEN_DOCKER_ROOT_001",
    "GEN_COMPOSE_PRIVILEGED_001",
    "GEN_K8S_PRIVILEGED_001",
    "GEN_K8S_RUN_AS_ROOT_001",
    "GEN_K8S_HOST_NETWORK_001",
    "GEN_K8S_HOSTPATH_001",
    "GEN_DEPENDENCY_HTTP_001",
    "SPRING_ACTUATOR_EXPOSED_001",
    "SPRING_H2_CONSOLE_001",
    "GEN_HSTS_DISABLED_001",
    "SQL_PRIV_001",
    "SQL_WEAK_PASSWORD_001",
    "SQL_FILE_WRITE_001",
}


BENCHMARK_CASES = [
    BenchmarkCase(
        case_id="node_marketplace_account_takeover",
        case_type="positive",
        files={
            "apps/api/src/account.ts": """
                import express from "express";
                import jwt from "jsonwebtoken";
                import _ from "lodash";
                import { execSync } from "child_process";

                const router = express.Router();
                const jwtSecret = "marketplace-jwt-secret-2026";

                router.post("/session", async (req, res) => {
                  const claims = jwt.decode(req.body.token);
                  res.cookie("session_token", req.body.token);
                  const user = await User.findOne(req.body);
                  const rows = await pool.query("SELECT * FROM users WHERE email='" + req.body.email + "'");
                  res.send(req.query.returnHtml);
                  execSync("convert " + req.body.file);
                  _.merge(accountPreferences, req.body);
                  Object.assign(Account, req.body);
                  res.redirect(req.query.nextUrl);
                  res.json({ claims, user, rows });
                });
            """,
        },
        expected_rules=NODE_ACCOUNT_RULES,
        forbidden_rules=set(),
    ),
    BenchmarkCase(
        case_id="spring_admin_exporter",
        case_type="positive",
        files={
            "backend/src/main/java/com/acme/AdminExportController.java": """
                http.authorizeHttpRequests(auth -> auth.requestMatchers("/admin/**").permitAll());
                String orderBy = request.getParameter("sort");
                Statement statement = connection.createStatement();
                ResultSet rows = statement.executeQuery("SELECT * FROM audit_log ORDER BY " + orderBy);
                ObjectInputStream input = new ObjectInputStream(request.getInputStream());
                Object job = input.readObject();
                Runtime.getRuntime().exec("tar -czf /tmp/out.tgz " + request.getParameter("dir"));
                File exportFile = new File("/srv/exports/" + request.getParameter("file"));
                response.getWriter().write("<pre>" + request.getParameter("q") + "</pre>");
            """,
        },
        expected_rules=SPRING_ADMIN_RULES,
        forbidden_rules=set(),
    ),
    BenchmarkCase(
        case_id="python_django_report_worker",
        case_type="positive",
        files={
            "reporting/settings.py": """
                ALLOWED_HOSTS = ["*"]
                SESSION_COOKIE_SECURE = False
                CSRF_COOKIE_SECURE = False
            """,
            "reporting/views.py": """
                import pickle
                import subprocess

                job_id = request.args.get("job")
                cursor.execute("DELETE FROM jobs WHERE id=" + job_id)
                subprocess.run("nslookup " + request.args.get("host"), shell=True)
                imported = pickle.load(uploaded_file)
                response = requests.get(request.args.get("url"), verify=False)
                return redirect(request.args.get("next"))
                return render_template_string(request.args.get("html"))
                app.run(host="0.0.0.0", debug=True)
            """,
        },
        expected_rules=PYTHON_REPORT_RULES,
        forbidden_rules=set(),
    ),
    BenchmarkCase(
        case_id="php_legacy_plugin",
        case_type="positive",
        files={
            "public/wp-content/plugins/legacy/admin.php": """
                <?php
                ini_set('allow_url_include', 'On');
                $userId = $_POST['user_id'];
                $rows = mysqli_query($db, "SELECT * FROM members WHERE id=$userId");
                print '<div>' . $_REQUEST['notice'] . '</div>';
                exec('ffmpeg -i ' . $_GET['input']);
                require $_GET['module'] . '.php';
                move_uploaded_file($_FILES['theme']['tmp_name'], 'uploads/' . $_FILES['theme']['name']);
                $profile = unserialize($_COOKIE['profile']);
                $legacyHash = sha1($password);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            """,
        },
        expected_rules=PHP_PLUGIN_RULES,
        forbidden_rules=set(),
    ),
    BenchmarkCase(
        case_id="infra_platform_baseline",
        case_type="positive",
        files={
            "Dockerfile": """
                FROM eclipse-temurin:21
                ADD http://repo.internal/bootstrap.sh /opt/bootstrap.sh
                ENV SERVICE_TOKEN=svc_live_123456789
                USER root
            """,
            "docker-compose.yml": """
                services:
                  worker:
                    image: acme/worker
                    privileged: true
            """,
            "k8s/deployment.yaml": """
                spec:
                  hostNetwork: true
                  containers:
                    - name: api
                      securityContext:
                        privileged: true
                        runAsUser: 0
                  volumes:
                    - name: host-root
                      hostPath:
                        path: /
            """,
            "src/main/resources/application.yml": """
                management:
                  endpoints:
                    web:
                      exposure:
                        include: "*"
                spring:
                  h2:
                    console:
                      enabled: true
            """,
            "nginx/default.conf": """
                add_header Strict-Transport-Security "max-age=0";
            """,
            "package.json": """
                { "publishConfig": { "registry": "http://packages.acme.local/npm" } }
            """,
            "db/bootstrap.sql": """
                GRANT ALL PRIVILEGES ON *.* TO 'report'@'%';
                ALTER USER 'report'@'%' IDENTIFIED BY 'password';
                SELECT access_token INTO OUTFILE '/tmp/tokens.txt' FROM api_keys;
            """,
        },
        expected_rules=INFRA_PLATFORM_RULES,
        forbidden_rules=set(),
    ),
    BenchmarkCase(
        case_id="node_marketplace_hardened",
        case_type="negative",
        files={
            "apps/api/src/account.ts": """
                import express from "express";
                import jwt from "jsonwebtoken";
                import { execFile } from "child_process";
                import escapeHtml from "escape-html";

                const router = express.Router();
                router.post("/session", async (req, res) => {
                  const claims = jwt.verify(req.body.token, process.env.JWT_PUBLIC_KEY, {
                    algorithms: ["RS256"],
                    issuer: "https://auth.example.com"
                  });
                  res.cookie("session_token", req.body.token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "lax"
                  });
                  const email = String(req.body.email);
                  const user = await User.findOne({ email });
                  const rows = await pool.query("SELECT * FROM users WHERE email=?", [email]);
                  res.send(escapeHtml(String(req.query.returnHtml)));
                  execFile("convert", [String(req.body.file)]);
                  const safeFields = pick(req.body, ["theme", "locale"]);
                  res.json({ claims, user, rows, safeFields });
                });
            """,
        },
        expected_rules=set(),
        forbidden_rules=NODE_ACCOUNT_RULES,
    ),
    BenchmarkCase(
        case_id="spring_admin_hardened",
        case_type="negative",
        files={
            "backend/src/main/java/com/acme/AdminExportController.java": """
                http.authorizeHttpRequests(auth -> auth.requestMatchers("/admin/**").hasRole("ADMIN"));
                PreparedStatement statement = connection.prepareStatement("SELECT * FROM audit_log WHERE actor=?");
                statement.setString(1, actor);
                AuditJob job = objectMapper.readValue(request.getInputStream(), AuditJob.class);
                new ProcessBuilder("tar", "-czf", "/tmp/out.tgz", safeDirectory).start();
                Path base = Paths.get("/srv/exports").toRealPath();
                Path exportFile = base.resolve(fileName).normalize();
                if (!exportFile.startsWith(base)) throw new SecurityException();
                response.getWriter().write("<pre>" + Encode.forHtml(query) + "</pre>");
            """,
        },
        expected_rules=set(),
        forbidden_rules=SPRING_ADMIN_RULES,
    ),
    BenchmarkCase(
        case_id="python_django_hardened",
        case_type="negative",
        files={
            "reporting/settings.py": """
                ALLOWED_HOSTS = ["reports.example.com"]
                SESSION_COOKIE_SECURE = True
                CSRF_COOKIE_SECURE = True
            """,
            "reporting/views.py": """
                import json
                import subprocess

                cursor.execute("DELETE FROM jobs WHERE id=%s", (job_id,))
                subprocess.run(["nslookup", host], check=True)
                imported = json.loads(uploaded_file.read())
                parsed = urlparse(url)
                if parsed.hostname not in allowed_hosts:
                    abort(400)
                response = requests.get(url, verify=True)
                return redirect("/reports")
                return render_template("report.html", report=report)
                app.run(host="127.0.0.1", debug=False)
            """,
        },
        expected_rules=set(),
        forbidden_rules=PYTHON_REPORT_RULES,
    ),
    BenchmarkCase(
        case_id="php_plugin_hardened",
        case_type="negative",
        files={
            "public/wp-content/plugins/legacy/admin.php": """
                <?php
                ini_set('allow_url_include', 'Off');
                $stmt = $pdo->prepare('SELECT * FROM members WHERE id = ?');
                $stmt->execute([$_POST['user_id']]);
                print '<div>' . htmlspecialchars($_REQUEST['notice'], ENT_QUOTES, 'UTF-8') . '</div>';
                if (preg_match('/^[a-zA-Z0-9._-]+$/', $_GET['input'])) {
                    exec('ffmpeg -i ' . escapeshellarg($_GET['input']));
                }
                $allowed = ['dashboard' => 'dashboard.php'];
                require $allowed[$_GET['module'] ?? 'dashboard'];
                $ext = strtolower(pathinfo($_FILES['theme']['name'], PATHINFO_EXTENSION));
                if (in_array($ext, ['jpg', 'png'], true)) {
                    move_uploaded_file($_FILES['theme']['tmp_name'], 'uploads/' . bin2hex(random_bytes(16)) . '.' . $ext);
                }
                $profile = json_decode($_COOKIE['profile'], true, flags: JSON_THROW_ON_ERROR);
                $legacyHash = password_hash($password, PASSWORD_ARGON2ID);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            """,
        },
        expected_rules=set(),
        forbidden_rules=PHP_PLUGIN_RULES,
    ),
    BenchmarkCase(
        case_id="infra_platform_hardened",
        case_type="negative",
        files={
            "Dockerfile": """
                FROM eclipse-temurin:21
                COPY bootstrap.sh /opt/bootstrap.sh
                USER app
            """,
            "docker-compose.yml": """
                services:
                  worker:
                    image: acme/worker
                    read_only: true
            """,
            "k8s/deployment.yaml": """
                spec:
                  containers:
                    - name: api
                      securityContext:
                        privileged: false
                        runAsNonRoot: true
                      volumeMounts:
                        - name: cache
                          mountPath: /cache
                  volumes:
                    - name: cache
                      emptyDir: {}
            """,
            "src/main/resources/application.yml": """
                management:
                  endpoints:
                    web:
                      exposure:
                        include: health,info
                spring:
                  h2:
                    console:
                      enabled: false
            """,
            "nginx/default.conf": """
                add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
            """,
            "package.json": """
                { "publishConfig": { "registry": "https://registry.npmjs.org/" } }
            """,
            "db/bootstrap.sql": """
                GRANT SELECT, INSERT, UPDATE ON report.* TO 'report'@'%';
                ALTER USER 'report'@'%' IDENTIFIED BY 'A-long-rotated-secret-2026!';
            """,
        },
        expected_rules=set(),
        forbidden_rules=INFRA_PLATFORM_RULES,
    ),
]


def analyze_benchmark_files(files: dict[str, str]) -> set[str]:
    detected: set[str] = set()
    for path, source in files.items():
        detected.update(finding.rule_id for finding in analyze_catalog_source(source, CATALOG_RULES))
        if path.endswith((".js", ".jsx", ".ts", ".tsx")):
            detected.update(finding.rule_id for finding in analyze_kisa_source(source, path, KISA_RULES))
    return detected


def calculate_benchmark_metrics() -> dict[str, object]:
    details: list[dict[str, object]] = []
    true_positive = 0
    false_negative = 0
    false_positive = 0
    true_negative = 0

    for case in BENCHMARK_CASES:
        detected = analyze_benchmark_files(case.files)
        expected_detected = case.expected_rules & detected
        missing = case.expected_rules - detected
        unexpected = case.forbidden_rules & detected
        clean_forbidden = case.forbidden_rules - detected

        true_positive += len(expected_detected)
        false_negative += len(missing)
        false_positive += len(unexpected)
        true_negative += len(clean_forbidden)

        details.append(
            {
                "caseId": case.case_id,
                "type": case.case_type,
                "expected": len(case.expected_rules),
                "forbidden": len(case.forbidden_rules),
                "detectedExpected": len(expected_detected),
                "missing": sorted(missing),
                "unexpected": sorted(unexpected),
                "detectedRuleCount": len(detected),
            }
        )

    precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 1.0
    recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 1.0
    false_positive_rate = false_positive / (false_positive + true_negative) if false_positive + true_negative else 0.0
    false_negative_rate = false_negative / (true_positive + false_negative) if true_positive + false_negative else 0.0

    return {
        "caseCount": len(BENCHMARK_CASES),
        "positiveCaseCount": sum(1 for case in BENCHMARK_CASES if case.case_type == "positive"),
        "negativeCaseCount": sum(1 for case in BENCHMARK_CASES if case.case_type == "negative"),
        "expectedLabelCount": true_positive + false_negative,
        "forbiddenLabelCount": false_positive + true_negative,
        "truePositive": true_positive,
        "falseNegative": false_negative,
        "falsePositive": false_positive,
        "trueNegative": true_negative,
        "precision": precision,
        "recall": recall,
        "falsePositiveRate": false_positive_rate,
        "falseNegativeRate": false_negative_rate,
        "details": details,
    }
