package com.chwiyakhaenne.api;

import com.chwiyakhaenne.analyzer.AnalyzerEngine;
import com.chwiyakhaenne.model.AnalysisResult;
import com.chwiyakhaenne.model.AnalyzeRequest;
import com.chwiyakhaenne.model.CodeFile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api")
public class AnalysisController {

    private final AnalyzerEngine analyzerEngine;
    private final UploadFileReader uploadFileReader;
    private final AnalysisRateLimiter rateLimiter;

    public AnalysisController(AnalyzerEngine analyzerEngine, UploadFileReader uploadFileReader, AnalysisRateLimiter rateLimiter) {
        this.analyzerEngine = analyzerEngine;
        this.uploadFileReader = uploadFileReader;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "ok",
                "service", "취약했네"
        );
    }

    @Async
    @PostMapping("/analyze")
    public CompletableFuture<ResponseEntity<AnalysisResult>> analyze(
            @Valid @org.springframework.web.bind.annotation.RequestBody AnalyzeRequest request,
            HttpServletRequest servletRequest
    ) {
        rateLimiter.check(servletRequest);
        return CompletableFuture.completedFuture(ResponseEntity.ok(analyzerEngine.analyze(request)));
    }

    @Async
    @PostMapping(value = "/analyze/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CompletableFuture<ResponseEntity<AnalysisResult>> analyzeUpload(
            @RequestParam(required = false) String projectName,
            @RequestPart("files") List<MultipartFile> files,
            HttpServletRequest servletRequest
    ) throws IOException {
        rateLimiter.check(servletRequest);
        List<CodeFile> codeFiles = uploadFileReader.read(files);
        AnalyzeRequest request = new AnalyzeRequest(projectName, codeFiles);
        return CompletableFuture.completedFuture(ResponseEntity.ok(analyzerEngine.analyze(request)));
    }
}
