from collections import Counter

from backend.analyzer.catalog_security_analyzer import analyze_rule_example, load_rules


REQUIRED_RULE_IDS = {
    "GEN_AUTH_001",
    "GEN_CI_SECRET_ECHO_001",
    "GEN_COMPOSE_PRIVILEGED_001",
    "GEN_CORS_001",
    "GEN_CSP_UNSAFE_INLINE_001",
    "GEN_DEPENDENCY_HTTP_001",
    "GEN_DEPENDENCY_WILDCARD_VERSION_001",
    "GEN_DOCKER_ADD_REMOTE_001",
    "GEN_DOCKER_CURL_BASH_001",
    "GEN_DOCKER_ROOT_001",
    "GEN_DOCKER_SECRET_ENV_001",
    "GEN_ERROR_001",
    "GEN_GITHUB_ACTION_UNPINNED_001",
    "GEN_GITHUB_ACTION_PULL_REQUEST_TARGET_001",
    "GEN_HSTS_DISABLED_001",
    "GEN_K8S_ALLOW_PRIV_ESC_001",
    "GEN_K8S_HOST_NETWORK_001",
    "GEN_K8S_HOSTPATH_001",
    "GEN_K8S_LATEST_TAG_001",
    "GEN_K8S_PRIVILEGED_001",
    "GEN_K8S_RUN_AS_ROOT_001",
    "GEN_K8S_AUTOMOUNT_TOKEN_001",
    "GEN_K8S_CAP_SYS_ADMIN_001",
    "GEN_K8S_HOSTPID_IPC_001",
    "GEN_LOG_001",
    "GEN_NPM_INSTALL_SCRIPT_001",
    "GEN_NGINX_AUTOINDEX_001",
    "GEN_NGINX_PROXY_SSL_VERIFY_OFF_001",
    "GEN_PUBLIC_ENV_SECRET_001",
    "GEN_REDIRECT_001",
    "GEN_SECRET_001",
    "GEN_SSRF_001",
    "GEN_TLS_001",
    "GEN_TERRAFORM_PUBLIC_S3_001",
    "GEN_TERRAFORM_PUBLIC_SG_001",
    "GEN_TERRAFORM_IAM_WILDCARD_001",
    "JAVA_CMDI_001",
    "JAVA_CORS_001",
    "JAVA_CRYPTO_001",
    "JAVA_CSRF_001",
    "JAVA_DESER_001",
    "JAVA_LOG_001",
    "JAVA_PATH_001",
    "JAVA_PERMIT_ALL_001",
    "JAVA_RANDOM_001",
    "JAVA_REDIRECT_001",
    "JAVA_SQLI_001",
    "JAVA_SPRING_SESSION_FIXATION_001",
    "JAVA_SSRF_001",
    "JAVA_TLS_001",
    "JAVA_XSS_001",
    "JAVA_XXE_001",
    "JAVA_JNDI_LOOKUP_001",
    "JAVA_SPEL_INJECTION_001",
    "NODE_CMDI_001",
    "NODE_COOKIE_FLAGS_001",
    "NODE_CSRF_001",
    "NODE_BODY_LIMIT_001",
    "NODE_EVAL_001",
    "NODE_GRAPHQL_INTROSPECTION_001",
    "NODE_HEADER_INJECTION_001",
    "NODE_HELMET_DISABLED_001",
    "NODE_JWT_DECODE_001",
    "NODE_JWT_NONE_ALG_001",
    "NODE_MULTER_ANY_001",
    "NODE_NOSQLI_001",
    "NODE_PATH_001",
    "NODE_PROTO_001",
    "NODE_SESSION_MEMORY_STORE_001",
    "NODE_SESSION_COOKIE_001",
    "NODE_SQLI_001",
    "NODE_SSRF_001",
    "NODE_RATE_LIMIT_001",
    "NODE_TLS_ENV_001",
    "NODE_XSS_001",
    "PHP_ALLOW_URL_INCLUDE_001",
    "PHP_CMDI_001",
    "PHP_DESER_001",
    "PHP_ERROR_001",
    "PHP_EXTRACT_OVERWRITE_001",
    "PHP_ASSERT_USER_INPUT_001",
    "PHP_FILE_001",
    "PHP_REDIRECT_001",
    "PHP_SQLI_001",
    "PHP_TLS_001",
    "PHP_UPLOAD_001",
    "PHP_WEAK_HASH_001",
    "PHP_XSS_001",
    "PY_CMDI_001",
    "PY_CELERY_PICKLE_SERIALIZER_001",
    "PY_CORS_001",
    "PY_DJANGO_ALLOWED_HOSTS_001",
    "PY_DJANGO_COOKIE_SECURE_001",
    "PY_DJANGO_CSRF_EXEMPT_001",
    "PY_DJANGO_DEBUG_001",
    "PY_EVAL_001",
    "PY_FLASK_DEBUG_001",
    "PY_FLASK_SECRET_KEY_001",
    "PY_JINJA_AUTOESCAPE_FALSE_001",
    "PY_JWT_NO_VERIFY_001",
    "PY_PATH_001",
    "PY_PICKLE_001",
    "PY_REQUESTS_NO_TIMEOUT_001",
    "PY_SQLI_001",
    "PY_SSRF_001",
    "PY_TEMPFILE_MKTEMP_001",
    "PY_TLS_001",
    "PY_XML_XXE_001",
    "PY_XSS_001",
    "PY_YAML_001",
    "REACT_JAVASCRIPT_URL_001",
    "REACT_TARGET_BLANK_001",
    "REACT_XSS_001",
    "SQL_DYNAMIC_001",
    "SQL_FILE_WRITE_001",
    "SQL_PRIV_001",
    "SQL_PUBLIC_GRANT_001",
    "SQL_WEAK_PASSWORD_001",
    "SPRING_ACTUATOR_EXPOSED_001",
    "SPRING_ACTUATOR_SHUTDOWN_001",
    "SPRING_ERROR_STACKTRACE_001",
    "SPRING_H2_CONSOLE_001",
    "TS_TYPE_001",
}

REQUIRED_FIELDS = {
    "rule_id",
    "language",
    "category",
    "severity",
    "kisa_category",
    "owasp",
    "cwe",
    "title",
    "description",
    "detect_hint",
    "bad_example",
    "good_example",
    "fix",
    "detectPatterns",
    "safePatterns",
}


def test_catalog_has_expected_rule_inventory():
    rules = load_rules()
    ids = {rule["rule_id"] for rule in rules}

    assert len(rules) == 123
    assert ids == REQUIRED_RULE_IDS

    language_counts = Counter(rule["language"] for rule in rules)
    assert language_counts == {
        "java": 18,
        "python": 22,
        "php": 13,
        "javascript/typescript": 24,
        "typescript": 1,
        "sql": 5,
        "generic": 36,
        "dockerfile": 4,
    }


def test_catalog_metadata_is_complete():
    for rule in load_rules():
        missing = REQUIRED_FIELDS - set(rule)
        assert not missing, f"{rule.get('rule_id', 'unknown')} missing {missing}"
        assert rule["detectPatterns"], f"{rule['rule_id']} has no detection pattern"
        assert rule["bad_example"].strip(), f"{rule['rule_id']} has no bad example"
        assert rule["good_example"].strip(), f"{rule['rule_id']} has no good example"


def test_catalog_positive_examples_are_detected():
    missed = []

    for rule in load_rules():
        findings = analyze_rule_example(rule, "bad_example")
        if rule["rule_id"] not in {finding.rule_id for finding in findings}:
            missed.append(rule["rule_id"])

    assert not missed


def test_catalog_negative_examples_are_not_detected_by_own_rule():
    false_positives = []

    for rule in load_rules():
        findings = analyze_rule_example(rule, "good_example")
        if rule["rule_id"] in {finding.rule_id for finding in findings}:
            false_positives.append(rule["rule_id"])

    assert not false_positives
