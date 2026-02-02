package com.example.auth.entity;

/**
 * User 엔티티
 *
 * 【학습 개념: JPA 엔티티】
 *
 * 엔티티는 데이터베이스 테이블과 매핑되는 클래스입니다:
 * - @Entity: JPA 엔티티임을 표시
 * - @Table: 테이블명 지정
 * - @Id: 기본 키
 * - @Column: 컬럼 매핑
 *
 * 【보안 개념: 비밀번호 저장】
 *
 * 비밀번호는 절대 평문으로 저장하지 않습니다:
 * - BCrypt로 해싱하여 저장
 * - @JsonIgnore로 JSON 응답에서 제외
 */

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore  // JSON 응답에서 제외
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    private String name;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 응답용 DTO로 변환
     */
    public UserResponse toResponse() {
        return UserResponse.builder()
                .id(this.id)
                .email(this.email)
                .name(this.name)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .build();
    }

    @Getter
    @Builder
    public static class UserResponse {
        private Long id;
        private String email;
        private String name;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
