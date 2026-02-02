package com.example.auth.security;

/**
 * Spring Security UserDetails 구현
 *
 * 【학습 개념: UserDetails】
 *
 * Spring Security에서 인증된 사용자 정보를 담는 인터페이스:
 * - getUsername(): 사용자 식별자
 * - getPassword(): 비밀번호
 * - getAuthorities(): 권한 목록
 * - isEnabled() 등: 계정 상태
 */

import com.example.auth.entity.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final User user;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();  // 역할 기반 권한이 필요하면 여기에 추가
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
