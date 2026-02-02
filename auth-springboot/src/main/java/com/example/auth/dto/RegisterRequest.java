package com.example.auth.dto;

/**
 * 회원가입 요청 DTO
 *
 * 【학습 개념: Bean Validation】
 *
 * Jakarta Validation 어노테이션으로 입력 검증:
 * - @NotBlank: null, 빈 문자열, 공백만 있는 문자열 불가
 * - @Email: 이메일 형식 검증
 * - @Size: 문자열 길이 제한
 * - @Pattern: 정규식 패턴 검증
 *
 * 【보안 개념: 입력 검증의 중요성】
 *
 * 모든 사용자 입력은 악의적일 수 있다고 가정:
 * - SQL Injection 방지
 * - XSS 공격 방지
 * - 데이터 무결성 보장
 */

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8, max = 50, message = "비밀번호는 8자 이상 50자 이하여야 합니다")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
        message = "비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다"
    )
    private String password;

    @Size(min = 2, max = 50, message = "이름은 2자 이상 50자 이하여야 합니다")
    private String name;
}
