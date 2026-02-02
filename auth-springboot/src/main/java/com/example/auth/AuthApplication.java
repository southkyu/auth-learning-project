package com.example.auth;

/**
 * Spring Boot 애플리케이션 진입점
 *
 * 【학습 개념: @SpringBootApplication】
 *
 * 이 어노테이션은 세 가지를 포함합니다:
 * - @Configuration: 설정 클래스임을 표시
 * - @EnableAutoConfiguration: 자동 설정 활성화
 * - @ComponentScan: 컴포넌트 스캔 (@Controller, @Service 등)
 */

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AuthApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);

        System.out.println("\n========================================");
        System.out.println("🚀 서버가 실행 중입니다!");
        System.out.println("========================================");
        System.out.println("📍 Base URL: http://localhost:3000");
        System.out.println("🏥 Health Check: http://localhost:3000/health");
        System.out.println("\n📚 API 엔드포인트:");
        System.out.println("   POST /api/auth/register       - 회원가입");
        System.out.println("   POST /api/auth/login          - JWT 로그인");
        System.out.println("   POST /api/auth/refresh        - 토큰 갱신");
        System.out.println("   GET  /api/auth/me             - 내 정보 (JWT)");
        System.out.println("   POST /api/auth/session/login  - Session 로그인");
        System.out.println("   POST /api/auth/session/logout - Session 로그아웃");
        System.out.println("   GET  /api/auth/session/me     - 내 정보 (Session)");
        System.out.println("========================================\n");
    }
}
