package com.example.auth.config;

/**
 * 전역 예외 핸들러
 *
 * 【학습 개념: @ControllerAdvice】
 *
 * 모든 컨트롤러의 예외를 한 곳에서 처리:
 * - 일관된 에러 응답 형식
 * - 예외 타입별 처리
 * - 로깅
 *
 * 【보안 개념: 에러 정보 노출】
 *
 * 운영 환경에서는 상세한 에러 정보를 숨깁니다:
 * - 스택 트레이스 노출 금지
 * - 내부 에러 메시지 대신 일반 메시지
 */

import com.example.auth.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Validation 예외 처리
     *
     * 【학습 포인트】
     * @Valid 검증 실패 시 발생하는 예외
     * 필드별 에러 메시지를 수집하여 반환
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex
    ) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.debug("Validation error: {}", errors);

        return ResponseEntity.badRequest()
                .body(ApiResponse.error("입력 값을 확인해주세요"));
    }

    /**
     * 인증 예외 처리
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(
            AuthenticationException ex
    ) {
        log.debug("Authentication error: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("인증에 실패했습니다"));
    }

    /**
     * 잘못된 인증 정보
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentialsException(
            BadCredentialsException ex
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("이메일 또는 비밀번호가 올바르지 않습니다"));
    }

    /**
     * IllegalArgumentException 처리
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(
            IllegalArgumentException ex
    ) {
        log.debug("IllegalArgumentException: {}", ex.getMessage());

        return ResponseEntity.badRequest()
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * 기타 모든 예외 처리
     *
     * 【보안 포인트】
     * 상세한 에러 정보를 로그에만 기록하고
     * 클라이언트에는 일반적인 메시지만 반환
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        log.error("Unexpected error", ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    }
}
