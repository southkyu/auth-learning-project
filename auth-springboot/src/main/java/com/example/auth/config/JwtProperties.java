package com.example.auth.config;

/**
 * JWT 설정 속성
 *
 * 【학습 개념: @ConfigurationProperties】
 *
 * application.yml의 설정을 타입 안전하게 바인딩:
 * jwt:
 *   secret: xxx
 *   expiration: 900000
 */

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {
    private String secret;
    private Long expiration;  // 밀리초
    private String refreshSecret;
    private Long refreshExpiration;  // 밀리초
}
