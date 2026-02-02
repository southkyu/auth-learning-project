package com.example.auth.repository;

/**
 * User 리포지토리
 *
 * 【학습 개념: Spring Data JPA】
 *
 * JpaRepository를 상속하면 기본 CRUD 메서드가 자동 생성됩니다:
 * - save(): 저장/수정
 * - findById(): ID로 조회
 * - findAll(): 전체 조회
 * - delete(): 삭제
 *
 * 메서드 이름 규칙으로 쿼리 자동 생성:
 * - findByEmail → SELECT * FROM users WHERE email = ?
 * - existsByEmail → SELECT COUNT(*) > 0 FROM users WHERE email = ?
 */

import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 이메일로 사용자 조회
     */
    Optional<User> findByEmail(String email);

    /**
     * 이메일 존재 여부 확인
     */
    boolean existsByEmail(String email);
}
