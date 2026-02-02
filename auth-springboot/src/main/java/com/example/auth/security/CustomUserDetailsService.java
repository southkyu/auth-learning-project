package com.example.auth.security;

/**
 * UserDetailsService 구현
 *
 * 【학습 개념: UserDetailsService】
 *
 * Spring Security가 사용자 정보를 로드할 때 사용:
 * - 로그인 시 사용자 조회
 * - 인증 과정에서 자동 호출
 */

import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "사용자를 찾을 수 없습니다: " + email
                ));

        return new CustomUserDetails(user);
    }
}
