package com.chwiyakhaenne.analyzer.rules;

import com.chwiyakhaenne.analyzer.AnalysisContext;
import com.chwiyakhaenne.model.CodeFile;
import com.chwiyakhaenne.model.Finding;
import com.chwiyakhaenne.model.Severity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public class FileUploadRule implements SecurityRule {

    private static final Pattern PATTERN = Pattern.compile(
            "(?i)(MultipartFile|RequestPart|multer\\s*\\(|request\\.files|FileStorage|save\\s*\\([^;]*file)"
    );
    private static final Pattern VALIDATION_PATTERN = Pattern.compile(
            "(?i)(contentType|mime|extension|allowlist|allowed|validate|virus|malware|fileSize)"
    );

    @Override
    public List<Finding> analyze(CodeFile file, AnalysisContext context) {
        if (!PATTERN.matcher(file.content()).find() || VALIDATION_PATTERN.matcher(file.content()).find()) {
            return List.of();
        }
        return RuleSupport.scan(
                file,
                Severity.MEDIUM,
                "파일 업로드",
                "파일 업로드 검증 부족",
                PATTERN,
                "파일 업로드 처리 코드가 보이지만 확장자, MIME, 크기 검증 흐름을 찾지 못했습니다.",
                "확장자 allowlist, MIME 확인, 용량 제한, 저장 경로 분리, 악성 파일 검사를 적용하세요.",
                """
                Set<String> allowed = Set.of("jpg", "png", "pdf");
                String extension = FilenameUtils.getExtension(file.getOriginalFilename());
                if (!allowed.contains(extension)) {
                    throw new IllegalArgumentException("Unsupported file type");
                }
                """
        );
    }
}
