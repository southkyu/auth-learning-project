package com.example.auth.dto;

/**
 * 토큰 갱신 요청 DTO
 */

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh 토큰은 필수입니다")
    private String refreshToken;
}
