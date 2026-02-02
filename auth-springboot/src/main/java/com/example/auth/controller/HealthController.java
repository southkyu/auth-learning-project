package com.example.auth.controller;

/**
 * 헬스 체크 컨트롤러
 */

import com.example.auth.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/")
    public ResponseEntity<String> root() {
        return ResponseEntity.ok("Auth Learning Project - Spring Boot");
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> data = Map.of(
            "status", "UP",
            "timestamp", LocalDateTime.now().toString()
        );

        return ResponseEntity.ok(ApiResponse.success("서버가 정상 작동 중입니다", data));
    }
}
