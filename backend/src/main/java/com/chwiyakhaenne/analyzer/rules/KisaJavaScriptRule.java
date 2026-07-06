package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class KisaJavaScriptRule implements SecurityRule {

    private static final Set<String> JS_EXTENSIONS = Set.of(".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs");
    private static final Pattern LINE_COMMENT = Pattern.compile("(?<!:)//.*?$|/\\*.*?\\*/", Pattern.MULTILINE | Pattern.DOTALL);
    private static final Pattern CALL_PATTERN = Pattern.compile("\\b([A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*)\\s*\\(");
    private static final Pattern MEMBER_PATTERN = Pattern.compile("\\.([A-Za-z_$][\\w$]*)\\b");
    private static final Pattern DEBUGGER_PATTERN = Pattern.compile("\\bdebugger\\s*;");

    private final List<RuleDefinition> rules;

    public KisaJavaScriptRule(ObjectMapper objectMapper) {
        this.rules = loadRules(objectMapper);
    }

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        if (!isJavaScript(file.path())) {
            return List.of();
        }

        String normalized = stripCommentsPreserveLines(file.content());
        Set<String> signals = extractSignals(normalized);
        List<Finding> findings = new ArrayList<>();

        for (RuleDefinition rule : rules) {
            String sourceForRule = Boolean.TRUE.equals(rule.includeComments()) ? file.content() : normalized;
            if (!hasRequiredSignal(rule, signals)) {
                continue;
            }
            for (Pattern pattern : rule.compiledDetectPatterns()) {
                Matcher matcher = pattern.matcher(sourceForRule);
                while (matcher.find()) {
                    if (isSafeMatch(rule, sourceForRule, matcher)) {
                        continue;
                    }
                    findings.add(toFinding(file, rule, sourceForRule, matcher.start()));
                    break;
                }
                if (!findings.isEmpty() && findings.get(findings.size() - 1).ruleId().equals(rule.id())) {
                    break;
                }
            }
        }

        return findings;
    }

    private List<RuleDefinition> loadRules(ObjectMapper objectMapper) {
        Path path = resolveRulePath();
        try {
            String json = Files.readString(path);
            List<RuleDefinition> definitions = objectMapper.readValue(json, new TypeReference<>() {
            });
            return definitions.stream()
                    .sorted((left, right) -> left.id().compareTo(right.id()))
                    .toList();
        } catch (IOException exception) {
            throw new IllegalStateException("KISA JavaScript rule catalog cannot be loaded: " + path, exception);
        }
    }

    private Path resolveRulePath() {
        List<Path> candidates = List.of(
                Path.of("rules", "kisa_js_rules.json"),
                Path.of("backend", "rules", "kisa_js_rules.json")
        );
        return candidates.stream()
                .filter(Files::isRegularFile)
                .findFirst()
                .orElse(candidates.get(0));
    }

    private boolean isJavaScript(String path) {
        String normalized = path.toLowerCase(Locale.ROOT);
        return JS_EXTENSIONS.stream().anyMatch(normalized::endsWith);
    }

    private boolean hasRequiredSignal(RuleDefinition rule, Set<String> signals) {
        if (rule.astSignals() == null || rule.astSignals().isEmpty()) {
            return true;
        }
        return rule.astSignals().stream().anyMatch(signals::contains);
    }

    private boolean isSafeMatch(RuleDefinition rule, String source, Matcher matcher) {
        String evidence = matcher.group() + "\n" + lineAt(source, matcher.start());
        return rule.compiledSafePatterns().stream().anyMatch(pattern -> pattern.matcher(evidence).find());
    }

    private Set<String> extractSignals(String source) {
        Set<String> signals = new HashSet<>();
        if (DEBUGGER_PATTERN.matcher(source).find()) {
            signals.add("keyword:debugger");
        }

        Matcher callMatcher = CALL_PATTERN.matcher(source);
        while (callMatcher.find()) {
            String callName = callMatcher.group(1);
            signals.add("call:" + callName);
            int dotIndex = callName.lastIndexOf('.');
            if (dotIndex >= 0) {
                signals.add("call:" + callName.substring(dotIndex + 1));
            }
        }

        Matcher memberMatcher = MEMBER_PATTERN.matcher(source);
        while (memberMatcher.find()) {
            signals.add("member:" + memberMatcher.group(1));
        }
        return signals;
    }

    private Finding toFinding(CodeFile file, RuleDefinition rule, String source, int offset) {
        int lineNumber = source.substring(0, offset).split("\n", -1).length;
        return RuleSupport.finding(
                file,
                rule.id(),
                Severity.valueOf(rule.severity()),
                rule.category(),
                rule.title(),
                lineNumber,
                lineAt(source, offset),
                rule.description(),
                rule.recommendation(),
                fixedExample(rule),
                rule.cwe(),
                rule.detectionType(),
                rule.kisaReference(),
                rule.kisaItem()
        );
    }

    private String fixedExample(RuleDefinition rule) {
        return switch (rule.id()) {
            case "JS-KISA-001" -> "await pool.query(\"SELECT * FROM users WHERE email = ?\", [email]);";
            case "JS-KISA-002" -> "const action = allowedActions[input]; if (action) action();";
            case "JS-KISA-003" -> "const resolved = path.resolve(BASE_DIR, path.basename(file)); if (!resolved.startsWith(BASE_DIR)) throw new Error(\"invalid path\");";
            case "JS-KISA-004" -> "res.send(`<h1>${escapeHtml(name)}</h1>`);";
            case "JS-KISA-005" -> "spawn(\"ls\", [\"-la\", safeDirectory], { shell: false });";
            case "JS-KISA-006" -> "multer({ limits: { fileSize: 1048576 }, fileFilter: allowOnlyImages });";
            case "JS-KISA-007" -> "const target = validateOutboundUrl(req.query.url, allowedHosts); await axios.get(target);";
            case "JS-KISA-008" -> "const jwtSecret = process.env.JWT_SECRET;";
            case "JS-KISA-009" -> "crypto.createHash(\"sha256\").update(value).digest(\"hex\");";
            case "JS-KISA-010" -> "logger.error(error); res.status(500).json({ message: \"Internal Server Error\" });";
            case "JS-KISA-011" -> "const email = account?.profile?.email ?? null;";
            case "JS-KISA-012" -> "logger.debug(\"checkout requested\", { cartId });";
            case "JS-KISA-013" -> "element.textContent = location.hash;";
            case "JS-KISA-014" -> "if (!allowedHosts.has(host)) throw new Error(\"blocked host\");";
            case "JS-KISA-015" -> "const parsed = schema.safeParse(JSON.parse(payload));";
            case "JS-KISA-016" -> "const target = validateRedirectUrl(req.query.next, allowedRedirects); res.redirect(target);";
            case "JS-KISA-017" -> "libxmljs.parseXml(xml, { noent: false, nonet: true });";
            case "JS-KISA-018" -> "const uid = escapeLDAP(req.query.uid); ldapClient.search(base, { filter: `(uid=${uid})` });";
            case "JS-KISA-019" -> "if (req.user.role === \"admin\") grantAdminRole(userId);";
            case "JS-KISA-020" -> "app.post(\"/admin/delete-user\", requireAuth, requireRole(\"admin\"), handler);";
            case "JS-KISA-021" -> "Invoice.findOne({ _id: req.params.id, ownerId: req.user.id });";
            case "JS-KISA-022" -> "crypto.generateKeyPairSync(\"rsa\", { modulusLength: 4096 });";
            case "JS-KISA-023" -> "const resetToken = crypto.randomBytes(32).toString(\"hex\");";
            case "JS-KISA-024" -> "https.request({ ca: trustedCa, rejectUnauthorized: true });";
            case "JS-KISA-025" -> "res.cookie(\"session\", value, { httpOnly: true, secure: true, sameSite: \"strict\" });";
            case "JS-KISA-026" -> "// example apiKey = \"redacted\"";
            case "JS-KISA-027" -> "const hash = await bcrypt.hash(password, 12);";
            case "JS-KISA-028" -> "verifySignature(downloadedBytes, expectedSignature);";
            case "JS-KISA-029" -> "app.post(\"/login\", loginLimiter, authenticateHandler);";
            case "JS-KISA-030" -> "while (retry < maxRetries) { if (pollQueue()) break; retry += 1; }";
            case "JS-KISA-031" -> "if (error) { logger.error(error); return next(error); }";
            case "JS-KISA-032" -> "catch (error) { logger.error(error); throw error; }";
            case "JS-OWASP-001" -> "const target = Object.create(null); copyAllowedKeys(target, input, safeKeys);";
            case "JS-OWASP-002" -> "if (input.length > 128) throw new Error(\"too long\"); RE2(pattern).test(input);";
            case "JS-OWASP-003" -> "app.use(cors({ origin: allowedOrigins, credentials: false }));";
            case "JS-OWASP-004" -> "https.request({ ca: trustedCa, rejectUnauthorized: true });";
            case "JS-OWASP-005" -> "app.post(\"/transfer\", csrf(), transferHandler);";
            case "JS-OWASP-006" -> "User.find({ email: { $eq: sanitizedEmail } });";
            case "JS-OWASP-007" -> "jwt.verify(token, publicKey, { algorithms: [\"RS256\"], issuer });";
            case "JS-OWASP-008" -> "Object.assign(user, pick(req.body, [\"displayName\", \"bio\"]));";
            case "JS-OWASP-009" -> "fetch(\"/login\", { method: \"POST\", body: JSON.stringify({ password }) });";
            case "JS-OWASP-010" -> "window.parent.postMessage(payload, \"https://app.example.com\");";
            case "JS-OWASP-011" -> "res.render(templateMap[req.body.template] || \"profile\", { user: req.user });";
            default -> rule.recommendation();
        };
    }

    private String lineAt(String source, int offset) {
        int start = source.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
        int end = source.indexOf('\n', offset);
        if (end < 0) {
            end = source.length();
        }
        return source.substring(start, end);
    }

    private String stripCommentsPreserveLines(String source) {
        Matcher matcher = LINE_COMMENT.matcher(source);
        StringBuilder stripped = new StringBuilder();
        while (matcher.find()) {
            matcher.appendReplacement(stripped, "\n".repeat((int) matcher.group().chars().filter(ch -> ch == '\n').count()));
        }
        matcher.appendTail(stripped);
        return stripped.toString();
    }

    private record RuleDefinition(
            String id,
            String title,
            String category,
            String severity,
            String cwe,
            String detectionType,
            String description,
            List<String> detectPatterns,
            List<String> safePatterns,
            List<String> astSignals,
            Boolean includeComments,
            String recommendation,
            String kisaReference,
            String kisaItem
    ) {
        private List<Pattern> compiledDetectPatterns() {
            return compile(detectPatterns);
        }

        private List<Pattern> compiledSafePatterns() {
            return compile(safePatterns);
        }

        private List<Pattern> compile(List<String> patterns) {
            if (patterns == null) {
                return List.of();
            }
            return patterns.stream().map(Pattern::compile).toList();
        }
    }
}
