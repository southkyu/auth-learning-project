package com.example.auth.controller;

/**
 * Auth 컨트롤러
 *
 * 【학습 개념: Spring MVC Controller】
 *
 * 컨트롤러는 HTTP 요청을 처리합니다:
 * - @RestController: JSON 응답 반환
 * - @RequestMapping: URL 경로 매핑
 * - @PostMapping, @GetMapping: HTTP 메서드 매핑
 * - @Valid: 입력 검증 활성화
 *
 * 【API 엔드포인트 목록】
 *
 * POST /api/auth/register       - 회원가입
 * POST /api/auth/login          - JWT 로그인
 * POST /api/auth/refresh        - 토큰 갱신
 * GET  /api/auth/me             - 내 정보 (JWT)
 * POST /api/auth/session/login  - Session 로그인
 * POST /api/auth/session/logout - Session 로그아웃
 * GET  /api/auth/session/me     - 내 정보 (Session)
 */

import com.example.auth.dto.*;
import com.example.auth.entity.User;
import com.example.auth.service.AuthService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 회원가입
     *
     * 【학습 포인트: @Valid】
     * RegisterRequest의 검증 어노테이션 자동 실행
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthService.AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthService.AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("회원가입이 완료되었습니다", response));
    }

    /**
     * JWT 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthService.AuthResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthService.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("로그인 성공", response));
    }

    /**
     * 토큰 갱신
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        TokenResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.success("토큰이 갱신되었습니다", response));
    }

    /**
     * 내 정보 조회 (JWT 인증)
     *
     * 【학습 포인트: @AuthenticationPrincipal】
     * SecurityContext에서 인증된 사용자 정보를 주입받음
     * JwtAuthenticationFilter에서 설정한 User 객체
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User.UserResponse>> getMe(
            @AuthenticationPrincipal User user
    ) {
        User.UserResponse response = authService.getUser(user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ========================================
    // Session 기반 인증 엔드포인트
    // ========================================

    /**
     * Session 로그인
     *
     * 【학습 포인트: HttpSession】
     * 세션에 사용자 정보 저장 → 세션 ID가 쿠키로 클라이언트에 전송
     */
    @PostMapping("/session/login")
    public ResponseEntity<ApiResponse<User.UserResponse>> sessionLogin(
            @Valid @RequestBody LoginRequest request,
            HttpSession session
    ) {
        AuthService.AuthResponse authResponse = authService.login(request);

        // 세션에 사용자 정보 저장
        session.setAttribute("userId", authResponse.getUser().getId());
        session.setAttribute("email", authResponse.getUser().getEmail());
        session.setAttribute("name", authResponse.getUser().getName());

        return ResponseEntity.ok(ApiResponse.success("세션 로그인 성공", authResponse.getUser()));
    }

    /**
     * Session 로그아웃
     *
     * 【학습 포인트: 세션 무효화】
     * session.invalidate()로 서버의 세션 데이터 삭제
     * → 클라이언트의 세션 쿠키는 무효화됨
     */
    @PostMapping("/session/logout")
    public ResponseEntity<ApiResponse<Void>> sessionLogout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(ApiResponse.success("로그아웃 되었습니다"));
    }

    /**
     * 내 정보 조회 (Session 인증)
     */
    @GetMapping("/session/me")
    public ResponseEntity<ApiResponse<User.UserResponse>> getSessionMe(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("로그인이 필요합니다"));
        }

        User.UserResponse response = authService.getUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
