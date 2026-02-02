package com.example.auth.service;

/**
 * Auth 서비스
 *
 * 【학습 개념: 서비스 레이어】
 *
 * 비즈니스 로직을 담당합니다:
 * - 컨트롤러는 HTTP 요청/응답만 처리
 * - 서비스는 실제 데이터 처리 로직
 * - 트랜잭션 관리
 */

import com.example.auth.dto.*;
import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import com.example.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 회원가입
     *
     * 【학습 포인트: @Transactional】
     * 메서드 실행을 트랜잭션으로 감싸서
     * 실패 시 자동 롤백
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다");
        }

        // 사용자 생성
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .build();

        user = userRepository.save(user);

        // 토큰 발급
        TokenResponse tokens = jwtTokenProvider.generateTokens(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .user(user.toResponse())
                .accessToken(tokens.getAccessToken())
                .refreshToken(tokens.getRefreshToken())
                .build();
    }

    /**
     * JWT 로그인
     *
     * 【보안 포인트】
     * 에러 메시지에서 이메일/비밀번호 중 무엇이 틀렸는지 구분하지 않음
     * → 공격자에게 힌트를 주지 않기 위함
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException(
                        "이메일 또는 비밀번호가 올바르지 않습니다"
                ));

        // 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다");
        }

        // 토큰 발급
        TokenResponse tokens = jwtTokenProvider.generateTokens(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .user(user.toResponse())
                .accessToken(tokens.getAccessToken())
                .refreshToken(tokens.getRefreshToken())
                .build();
    }

    /**
     * 토큰 갱신
     *
     * 【학습 개념: Refresh Token 사용】
     *
     * Access Token이 만료되었을 때:
     * 1. Refresh Token으로 새 토큰 요청
     * 2. Refresh Token 검증
     * 3. 새 Access Token + Refresh Token 발급
     */
    @Transactional(readOnly = true)
    public TokenResponse refresh(RefreshTokenRequest request) {
        // Refresh Token 검증
        if (!jwtTokenProvider.validateRefreshToken(request.getRefreshToken())) {
            throw new IllegalArgumentException("유효하지 않은 Refresh Token입니다");
        }

        // 사용자 ID 추출
        Long userId = jwtTokenProvider.getUserIdFromRefreshToken(request.getRefreshToken());

        // 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // 새 토큰 발급
        return jwtTokenProvider.generateTokens(user.getId(), user.getEmail());
    }

    /**
     * 사용자 조회
     */
    @Transactional(readOnly = true)
    public User.UserResponse getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        return user.toResponse();
    }

    /**
     * 로그인 응답 DTO
     */
    @lombok.Getter
    @lombok.Builder
    public static class AuthResponse {
        private User.UserResponse user;
        private String accessToken;
        private String refreshToken;
    }
}
