from backend.analyzer.catalog_security_analyzer import analyze_source as analyze_catalog_source
from backend.analyzer.catalog_security_analyzer import load_rules as load_catalog_rules
from backend.analyzer.kisa_js_analyzer import analyze_source as analyze_kisa_source
from backend.analyzer.kisa_js_analyzer import load_rules as load_kisa_rules


CATALOG_RULES = load_catalog_rules()
KISA_RULES = load_kisa_rules()


REALISTIC_VULNERABLE_SCENARIOS = [
    (
        "node_react_admin_panel",
        {
            "frontend/src/routes/admin.tsx": """
                import express from "express";
                import session from "express-session";
                import helmet from "helmet";
                import { exec } from "child_process";
                import { createReadStream } from "fs";
                import jwt from "jsonwebtoken";

                const router = express.Router();
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
                const stripeKey = "sk_live_real_secret_123456789";

                app.use(express.json({ limit: "100mb" }));
                app.use(helmet({ contentSecurityPolicy: false, frameguard: false }));
                router.use(session({ secret: "keyboard-cat", cookie: { httpOnly: false } }));
                router.post("/login", (req, res) => {
                  const user = jwt.decode(req.headers.authorization);
                  res.cookie("auth_token", req.body.token);
                  res.json(user);
                });
                router.get("/users", async (req, res) => {
                  const keyword = req.query.keyword;
                  const rows = await db.query(`SELECT * FROM users WHERE name = '${keyword}'`);
                  res.send("<section>" + req.query.bio + "</section>");
                });
                router.get("/proxy", async (req, res) => res.send(await fetch(req.query.url).then((r) => r.text())));
                router.get("/ping", (req, res) => exec("ping " + req.query.host));
                router.get("/download", (req, res) => createReadStream(req.query.path).pipe(res));
                router.get("/next", (req, res) => res.redirect(req.query.next));
                router.delete("/admin/users/:id", (req, res) => removeUser(req.params.id));

                export function Profile({ html }) {
                  return <a target="_blank" href="javascript:alert(1)" dangerouslySetInnerHTML={{ __html: html }} />;
                }
            """
        },
        {
            "NODE_TLS_ENV_001",
            "JS-KISA-024",
            "JS-OWASP-004",
            "GEN_SECRET_001",
            "JS-KISA-008",
            "NODE_JWT_DECODE_001",
            "NODE_COOKIE_FLAGS_001",
            "NODE_SESSION_COOKIE_001",
            "NODE_SESSION_MEMORY_STORE_001",
            "NODE_BODY_LIMIT_001",
            "NODE_HELMET_DISABLED_001",
            "NODE_SQLI_001",
            "JS-KISA-001",
            "NODE_XSS_001",
            "JS-KISA-004",
            "GEN_SSRF_001",
            "JS-KISA-007",
            "NODE_CMDI_001",
            "JS-KISA-005",
            "NODE_PATH_001",
            "JS-KISA-003",
            "GEN_REDIRECT_001",
            "JS-KISA-016",
            "GEN_AUTH_001",
            "JS-KISA-020",
            "NODE_CSRF_001",
            "REACT_TARGET_BLANK_001",
            "REACT_JAVASCRIPT_URL_001",
            "REACT_XSS_001",
        },
    ),
    (
        "spring_legacy_controller",
        {
            "backend/src/main/java/com/example/LegacyAdminController.java": """
                String id = request.getParameter("id");
                Statement st = conn.createStatement();
                ResultSet rs = st.executeQuery("SELECT * FROM users WHERE id='" + id + "'");
                Runtime.getRuntime().exec("sh -c " + request.getParameter("cmd"));
                File target = new File("/app/uploads/" + request.getParameter("file"));
                response.getWriter().write("<p>" + request.getParameter("name") + "</p>");
                logger.info("password={}", password);
                http.csrf().disable();
                CorsConfiguration config = new CorsConfiguration();
                config.addAllowedOrigin("*");
                builder.setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE);
                http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
                DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
                Document doc = dbf.newDocumentBuilder().parse(request.getInputStream());
                Object bean = new InitialContext().lookup("ldap://" + request.getParameter("jndi"));
                MessageDigest md = MessageDigest.getInstance("MD5");
                String token = Long.toHexString(new Random().nextLong());
            """
        },
        {
            "JAVA_SQLI_001",
            "JAVA_CMDI_001",
            "JAVA_PATH_001",
            "JAVA_XSS_001",
            "JAVA_LOG_001",
            "JAVA_CSRF_001",
            "JAVA_CORS_001",
            "JAVA_TLS_001",
            "JAVA_PERMIT_ALL_001",
            "JAVA_XXE_001",
            "JAVA_JNDI_LOOKUP_001",
            "JAVA_CRYPTO_001",
            "JAVA_RANDOM_001",
        },
    ),
    (
        "flask_report_api",
        {
            "services/report.py": """
                import os
                import pickle
                import tempfile
                import yaml
                from django.views.decorators.csrf import csrf_exempt
                from jinja2 import Environment
                from lxml import etree

                app.secret_key = "hardcoded-super-secret-key"
                env = Environment(loader=loader, autoescape=False)
                parser = etree.XMLParser(resolve_entities=True)
                xml_doc = etree.fromstring(request.data, parser)
                tmp_path = tempfile.mktemp()
                DEBUG = True
                @csrf_exempt
                def transfer(request):
                    return update_balance(request.POST["amount"])
                user_id = request.args.get("id")
                cursor.execute(f"SELECT * FROM reports WHERE id = '{user_id}'")
                os.system("tar -cf /tmp/report.tar " + request.args.get("path"))
                result = eval(request.args.get("expr"))
                obj = pickle.loads(request.data)
                data = yaml.load(request.data, Loader=yaml.Loader)
                endpoint = request.args.get("url")
                return requests.get(endpoint).text
                response = requests.get(admin_url, verify=False)
                return redirect(request.args.get("next"))
                return render_template_string(request.args.get("tpl"))
                return send_file("/srv/files/" + request.args.get("name"))
                app.run(host="0.0.0.0", debug=True)
            """,
            "config/settings.py": """
                ALLOWED_HOSTS = ["*"]
                SESSION_COOKIE_SECURE = False
                CSRF_COOKIE_SECURE = False
            """
        },
        {
            "PY_SQLI_001",
            "PY_CMDI_001",
            "PY_EVAL_001",
            "PY_PICKLE_001",
            "PY_YAML_001",
            "PY_SSRF_001",
            "PY_TLS_001",
            "GEN_REDIRECT_001",
            "PY_XSS_001",
            "PY_PATH_001",
            "PY_FLASK_DEBUG_001",
            "PY_FLASK_SECRET_KEY_001",
            "PY_DJANGO_DEBUG_001",
            "PY_DJANGO_CSRF_EXEMPT_001",
            "PY_JINJA_AUTOESCAPE_FALSE_001",
            "PY_XML_XXE_001",
            "PY_TEMPFILE_MKTEMP_001",
            "PY_DJANGO_ALLOWED_HOSTS_001",
            "PY_DJANGO_COOKIE_SECURE_001",
        },
    ),
    (
        "php_cms_upload",
        {
            "public/admin.php": """
                <?php
                extract($_REQUEST);
                $id = $_GET['id'];
                $result = mysqli_query($conn, "SELECT * FROM users WHERE id='$id'");
                echo '<h1>' . $_GET['name'] . '</h1>';
                system('ping ' . $_GET['host']);
                include $_GET['page'] . '.php';
                move_uploaded_file($_FILES['file']['tmp_name'], 'uploads/' . $_FILES['file']['name']);
                $state = unserialize($_COOKIE['state']);
                $digest = md5($password);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                ini_set('allow_url_include', '1');
            """
        },
        {
            "PHP_SQLI_001",
            "PHP_XSS_001",
            "PHP_CMDI_001",
            "PHP_FILE_001",
            "PHP_UPLOAD_001",
            "PHP_DESER_001",
            "PHP_WEAK_HASH_001",
            "PHP_TLS_001",
            "PHP_ALLOW_URL_INCLUDE_001",
            "PHP_EXTRACT_OVERWRITE_001",
        },
    ),
    (
        "infra_supply_chain",
        {
            "infra/Dockerfile": """
                FROM node:20
                ADD https://downloads.example.com/install.sh /tmp/install.sh
                RUN curl -fsSL https://downloads.example.com/install.sh | bash
                ARG NPM_TOKEN=npm_123456789abcdef
                USER root
            """,
            "infra/docker-compose.yml": """
                services:
                  app:
                    image: chwiyakhaenne/app
                    privileged: true
            """,
            "infra/deployment.yaml": """
                containers:
                  - name: app
                    securityContext:
                      privileged: true
                      runAsUser: 0
                      allowPrivilegeEscalation: true
                      runAsNonRoot: false
                    image: ghcr.io/acme/api:latest
                automountServiceAccountToken: true
                hostNetwork: true
                volumes:
                  - name: host-docker
                    hostPath:
                      path: /var/run/docker.sock
            """,
            "backend/src/main/resources/application.properties": """
                management.endpoints.web.exposure.include=*
                management.endpoint.shutdown.enabled=true
                spring.h2.console.enabled=true
            """,
            "nginx/security.conf": """
                add_header Strict-Transport-Security "max-age=0";
                autoindex on;
                proxy_ssl_verify off;
            """,
            "infra/main.tf": """
                resource "aws_s3_bucket" "logs" {
                  acl = "public-read"
                }

                resource "aws_security_group" "admin" {
                  ingress {
                    from_port = 22
                    to_port = 22
                    cidr_blocks = ["0.0.0.0/0"]
                  }
                }
            """,
            ".github/workflows/ci.yml": """
                steps:
                  - uses: actions/checkout@master
            """,
            "package.json": """
                {
                  "registry": "http://registry.npm.internal.local/",
                  "scripts": {
                    "postinstall": "curl -fsSL https://example.com/setup.sh | sh"
                  },
                  "dependencies": {
                    "express": "latest"
                  }
                }
            """,
            "db/grants.sql": """
                GRANT ALL PRIVILEGES ON *.* TO 'app'@'%';
                ALTER USER 'app'@'%' IDENTIFIED BY 'changeme';
                SELECT secret INTO OUTFILE '/tmp/leak.txt' FROM users;
            """,
        },
        {
            "GEN_DOCKER_SECRET_ENV_001",
            "GEN_DOCKER_ADD_REMOTE_001",
            "GEN_DOCKER_CURL_BASH_001",
            "GEN_DOCKER_ROOT_001",
            "GEN_COMPOSE_PRIVILEGED_001",
            "GEN_K8S_PRIVILEGED_001",
            "GEN_K8S_RUN_AS_ROOT_001",
            "GEN_K8S_ALLOW_PRIV_ESC_001",
            "GEN_K8S_LATEST_TAG_001",
            "GEN_K8S_HOST_NETWORK_001",
            "GEN_K8S_HOSTPATH_001",
            "GEN_K8S_AUTOMOUNT_TOKEN_001",
            "GEN_DEPENDENCY_HTTP_001",
            "SPRING_ACTUATOR_EXPOSED_001",
            "SPRING_ACTUATOR_SHUTDOWN_001",
            "SPRING_H2_CONSOLE_001",
            "GEN_HSTS_DISABLED_001",
            "GEN_NGINX_AUTOINDEX_001",
            "GEN_NGINX_PROXY_SSL_VERIFY_OFF_001",
            "GEN_TERRAFORM_PUBLIC_S3_001",
            "GEN_TERRAFORM_PUBLIC_SG_001",
            "GEN_GITHUB_ACTION_UNPINNED_001",
            "GEN_NPM_INSTALL_SCRIPT_001",
            "GEN_DEPENDENCY_WILDCARD_VERSION_001",
            "SQL_PRIV_001",
            "SQL_WEAK_PASSWORD_001",
            "SQL_FILE_WRITE_001",
        },
    ),
]


def analyze_files(files: dict[str, str]) -> set[str]:
    detected: set[str] = set()
    for path, source in files.items():
        detected.update(finding.rule_id for finding in analyze_catalog_source(source, CATALOG_RULES))
        if path.endswith((".js", ".jsx", ".ts", ".tsx")):
            detected.update(finding.rule_id for finding in analyze_kisa_source(source, path, KISA_RULES))
    return detected


def test_realistic_vulnerable_scenarios_detect_expected_rules():
    misses: dict[str, list[str]] = {}

    for scenario_name, files, expected_rules in REALISTIC_VULNERABLE_SCENARIOS:
        detected = analyze_files(files)
        missing = sorted(expected_rules - detected)
        if missing:
            misses[scenario_name] = missing

    assert not misses


def test_realistic_vulnerable_scenarios_are_not_soft_results():
    weak_results: dict[str, int] = {}

    for scenario_name, files, expected_rules in REALISTIC_VULNERABLE_SCENARIOS:
        detected = analyze_files(files)
        if len(expected_rules & detected) < 8:
            weak_results[scenario_name] = len(expected_rules & detected)

    assert not weak_results
