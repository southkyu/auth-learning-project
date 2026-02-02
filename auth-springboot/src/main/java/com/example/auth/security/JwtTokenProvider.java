package com.example.auth.security;

/**
 * JWT 토큰 생성/검증 유틸리티
 *
 * 【학습 개념: JWT 구조】
 *
 * JWT는 세 부분으로 구성됩니다:
 * 1. Header: 토큰 타입과 해싱 알고리즘
 * 2. Payload: 실제 데이터 (클레임)
 * 3. Signature: 토큰 검증용 서명
 *
 * 【보안 개념: Access Token vs Refresh Token】
 *
 * Access Token:
 * - 짧은 만료 시간 (15분)
 * - API 요청 시 사용
 * - 탈취 시 피해 최소화
 *
 * Refresh Token:
 * - 긴 만료 시간 (7일)
 * - Access Token 재발급에만 사용
 * - 안전하게 저장 (httpOnly 쿠키)
 */

import com.example.auth.config.JwtProperties;
import com.example.auth.dto.TokenResponse;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    private SecretKey accessKey;
    private SecretKey refreshKey;

    @PostConstruct
    public void init() {
        // 비밀 키 초기화
        this.accessKey = Keys.hmacShaKeyFor(
            jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8)
        );
        this.refreshKey = Keys.hmacShaKeyFor(
            jwtProperties.getRefreshSecret().getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * Access Token + Refresh Token 생성
     */
    public TokenResponse generateTokens(Long userId, String email) {
        return TokenResponse.builder()
                .accessToken(generateAccessToken(userId, email))
                .refreshToken(generateRefreshToken(userId, email))
                .build();
    }

    /**
     * Access Token 생성
     *
     * 【학습 포인트: JWT 클레임】
     * - sub: 토큰 주체 (사용자 ID)
     * - email: 사용자 이메일
     * - type: 토큰 타입 (access/refresh)
     * - iat: 발급 시간
     * - exp: 만료 시간
     */
    private String generateAccessToken(Long userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getExpiration());

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("type", "access")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(accessKey)
                .compact();
    }

    /**
     * Refresh Token 생성
     */
    private String generateRefreshToken(Long userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getRefreshExpiration());

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(expiry)
                .signWith(refreshKey)
                .compact();
    }

    /**
     * Access Token에서 사용자 ID 추출
     */
    public Long getUserIdFromAccessToken(String token) {
        Claims claims = parseAccessToken(token);
        return Long.parseLong(claims.getSubject());
    }

    /**
     * Refresh Token에서 사용자 ID 추출
     */
    public Long getUserIdFromRefreshToken(String token) {
        Claims claims = parseRefreshToken(token);

        // Refresh Token 타입 확인
        String type = claims.get("type", String.class);
        if (!"refresh".equals(type)) {
            throw new JwtException("잘못된 토큰 타입입니다");
        }

        return Long.parseLong(claims.getSubject());
    }

    /**
     * Access Token 파싱
     */
    private Claims parseAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(accessKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Refresh Token 파싱
     */
    private Claims parseRefreshToken(String token) {
        return Jwts.parser()
                .verifyWith(refreshKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Access Token 유효성 검증
     */
    public boolean validateAccessToken(String token) {
        try {
            Claims claims = parseAccessToken(token);

            // Access Token 타입 확인
            String type = claims.get("type", String.class);
            return "access".equals(type);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Refresh Token 유효성 검증
     */
    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = parseRefreshToken(token);

            // Refresh Token 타입 확인
            String type = claims.get("type", String.class);
            return "refresh".equals(type);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid refresh token: {}", e.getMessage());
            return false;
        }
    }
}
