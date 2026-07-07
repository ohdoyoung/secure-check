package com.chwiyakhaenne.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.IOException;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException exception) {
        boolean fileCountExceeded = exception.getBindingResult().getFieldErrors().stream()
                .anyMatch(error -> "files".equals(error.getField()) && "Size".equals(error.getCode()));
        if (fileCountExceeded) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "분석 대상 파일은 최대 10,000개까지 지원합니다. 의존성, 빌드 산출물, 가상환경 폴더를 제외하고 다시 선택해 주세요."
            ));
        }
        return ResponseEntity.badRequest().body(Map.of(
                "message", "분석할 코드 파일이 필요합니다."
        ));
    }

    @ExceptionHandler(IOException.class)
    public ResponseEntity<Map<String, String>> handleIo(IOException exception) {
        if (exception.getMessage() != null
                && (exception.getMessage().startsWith("ZIP ") || exception.getMessage().startsWith("UPLOAD "))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", "업로드 제한을 초과했습니다. 파일 수, 파일 크기, 압축 해제 크기를 줄여 주세요."
            ));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "message", "업로드 파일을 읽을 수 없습니다."
        ));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<Map<String, String>> handleRateLimit() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "message", "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
        ));
    }
}
