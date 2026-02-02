# Auth-Spring Boot 인증 라이프사이클

## 1. 애플리케이션 부트스트랩

```
┌─────────────────────────────────────────────────────────────┐
│                Spring Boot Bootstrap Flow                    │
└─────────────────────────────────────────────────────────────┘

SpringApplication.run(AuthApplication.class)
       │
       ▼
┌──────────────────────────────────┐
│      Auto Configuration          │
│  @SpringBootApplication          │
│  ├── @Configuration              │
│  ├── @EnableAutoConfiguration    │
│  └── @ComponentScan              │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│      Component Scanning          │
│  - @Controller                   │
│  - @Service                      │
│  - @Repository                   │
│  - @Component                    │
│  - @Configuration                │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│      Bean Creation & DI          │
│  - SecurityConfig                │
│  - JwtTokenProvider              │
│  - AuthService                   │
│  - UserRepository                │
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│      JPA Initialization          │
│  - DataSource 연결               │
│  - Entity 스캔                   │
│  - ddl-auto: update              │
└──────────────────────────────────┘
       │
       ▼
Embedded Tomcat Start (port: 3000)
```

---

## 2. 레이어드 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Layered Architecture                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Controller Layer                          │
│  @RestController                                             │
│  - AuthController                                            │
│  - HTTP 요청/응답 처리                                        │
│  - @Valid 입력 검증                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  @Service                                                    │
│  - AuthService                                               │
│  - 비즈니스 로직                                              │
│  - @Transactional 트랜잭션 관리                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Repository Layer                           │
│  @Repository (JpaRepository)                                 │
│  - UserRepository                                            │
│  - 데이터베이스 액세스                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Entity Layer                              │
│  @Entity                                                     │
│  - User                                                      │
│  - 테이블 매핑                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Spring Security Filter Chain

```
┌─────────────────────────────────────────────────────────────┐
│                Security Filter Chain Flow                    │
└─────────────────────────────────────────────────────────────┘

HTTP Request
     │
     ▼
┌────────────────────┐
│   CorsFilter       │  → CORS 헤더 처리
└────────────────────┘
     │
     ▼
┌────────────────────┐
│   CsrfFilter       │  → CSRF 토큰 검증 (비활성화)
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ JwtAuthentication  │  → JWT 토큰 검증
│     Filter         │     Authorization: Bearer <token>
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ UsernamePassword   │  → Form 로그인 처리
│ AuthFilter         │     (Session 인증 시 사용)
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ SecurityContext    │  → 인증 정보 저장
│ PersistenceFilter  │     SecurityContextHolder
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ Authorization      │  → 접근 권한 확인
│     Filter         │     .authorizeHttpRequests()
└────────────────────┘
     │
     ▼
┌────────────────────┐
│ ExceptionTranslation│  → 인증/인가 예외 처리
│     Filter         │
└────────────────────┘
     │
     ▼
Controller (DispatcherServlet)
```

---

## 4. JWT 인증 라이프사이클

### 4.1 회원가입 (`POST /api/auth/register`)

```
Client                        Controller                    Service                      Repository
   │                               │                           │                            │
   │── { email, password, name } ─>│                           │                            │
   │                               │                           │                            │
   │                               │  [@Valid]                 │                            │
   │                               │  RegisterRequest 검증     │                            │
   │                               │                           │                            │
   │                               │── register(request) ─────>│                            │
   │                               │                           │── existsByEmail() ────────>│
   │                               │                           │<───── true/false ──────────│
   │                               │                           │                            │
   │                               │                           │  [BCrypt 비밀번호 해싱]     │
   │                               │                           │  passwordEncoder.encode()  │
   │                               │                           │                            │
   │                               │                           │── save(user) ─────────────>│
   │                               │                           │<───── user ────────────────│
   │                               │                           │                            │
   │                               │                           │  [JWT 토큰 생성]            │
   │                               │                           │  jwtTokenProvider          │
   │                               │<── AuthResponse ──────────│                            │
   │<── { user, tokens } ──────────│                           │                            │
```

### 4.2 로그인 (`POST /api/auth/login`)

```
Client                        Controller                    Service                   JwtTokenProvider
   │                               │                           │                            │
   │── { email, password } ───────>│                           │                            │
   │                               │                           │                            │
   │                               │── login(request) ────────>│                            │
   │                               │                           │                            │
   │                               │                           │  [사용자 조회]              │
   │                               │                           │  userRepository.findByEmail()
   │                               │                           │                            │
   │                               │                           │  [비밀번호 검증]            │
   │                               │                           │  passwordEncoder.matches() │
   │                               │                           │                            │
   │                               │                           │── generateTokens() ───────>│
   │                               │                           │                            │
   │                               │                           │   [Access Token 생성]      │
   │                               │                           │   - sub: userId            │
   │                               │                           │   - email                  │
   │                               │                           │   - type: "access"         │
   │                               │                           │   - exp: 15분              │
   │                               │                           │                            │
   │                               │                           │   [Refresh Token 생성]     │
   │                               │                           │   - type: "refresh"        │
   │                               │                           │   - exp: 7일               │
   │                               │                           │                            │
   │                               │                           │<── TokenResponse ──────────│
   │                               │<── AuthResponse ──────────│                            │
   │<── { user, tokens } ──────────│                           │                            │
```

### 4.3 인증된 요청 (`GET /api/auth/me`)

```
Client                   JwtAuthenticationFilter         SecurityContext            Controller
   │                            │                            │                           │
   │── Authorization: Bearer ──>│                            │                           │
   │      <accessToken>         │                            │                           │
   │                            │                            │                           │
   │                            │  [토큰 추출]                │                           │
   │                            │  extractTokenFromHeader()  │                           │
   │                            │                            │                           │
   │                            │  [토큰 검증]                │                           │
   │                            │  jwtTokenProvider          │                           │
   │                            │  .validateAccessToken()    │                           │
   │                            │                            │                           │
   │                            │  [사용자 조회]              │                           │
   │                            │  userRepository.findById() │                           │
   │                            │                            │                           │
   │                            │  [인증 객체 생성]           │                           │
   │                            │  UsernamePasswordAuthenticationToken                  │
   │                            │──────────────────────────>│                           │
   │                            │                            │                           │
   │                            │         SecurityContextHolder.setAuthentication()     │
   │                            │                            │                           │
   │                            │  filterChain.doFilter()    │                           │
   │                            │───────────────────────────────────────────────────────>│
   │                            │                            │                           │
   │                            │                            │   @AuthenticationPrincipal │
   │                            │                            │   User 주입                │
   │                            │                            │                           │
   │<────────────────────────────────────────────────────────────── { user } ───────────│
```

### 4.4 토큰 갱신 (`POST /api/auth/refresh`)

```
Client                        Controller                    Service                   JwtTokenProvider
   │                               │                           │                            │
   │── { refreshToken } ──────────>│                           │                            │
   │                               │                           │                            │
   │                               │── refresh(request) ──────>│                            │
   │                               │                           │                            │
   │                               │                           │── validateRefreshToken() ─>│
   │                               │                           │<───── true/false ──────────│
   │                               │                           │                            │
   │                               │                           │── getUserIdFromRefresh() ─>│
   │                               │                           │<───── userId ──────────────│
   │                               │                           │                            │
   │                               │                           │  [사용자 존재 확인]         │
   │                               │                           │  userRepository.findById() │
   │                               │                           │                            │
   │                               │                           │── generateTokens() ───────>│
   │                               │                           │<── TokenResponse ──────────│
   │                               │                           │                            │
   │                               │<── TokenResponse ─────────│                            │
   │<── { accessToken, ────────────│                           │                            │
   │      refreshToken }           │                           │                            │
```

---

## 5. Session 인증 라이프사이클

### 5.1 로그인 (`POST /api/auth/session/login`)

```
Client                        Controller                    HttpSession              Session Store (JDBC)
   │                               │                           │                            │
   │── { email, password } ───────>│                           │                            │
   │                               │                           │                            │
   │                               │  [사용자 검증]             │                            │
   │                               │  authService.login()      │                            │
   │                               │                           │                            │
   │                               │── setAttribute() ────────>│                            │
   │                               │   "userId", "email"       │                            │
   │                               │                           │── 세션 저장 ──────────────>│
   │                               │                           │                            │
   │<── Set-Cookie: SESSION ───────│                           │                            │
   │    { user }                   │                           │                            │
```

### 5.2 인증된 요청 (`GET /api/auth/session/me`)

```
Client                       Spring Session              Controller
   │                              │                           │
   │── Cookie: SESSION ──────────>│                           │
   │                              │                           │
   │                              │  [세션 조회]               │
   │                              │  JDBC Session Store       │
   │                              │                           │
   │                              │  [HttpSession 복원]        │
   │                              │──────────────────────────>│
   │                              │                           │
   │                              │        session.getAttribute("userId")
   │                              │                           │
   │                              │        [사용자 조회]       │
   │                              │        authService.getUser()
   │                              │                           │
   │<─────────────────────────────────────── { user } ────────│
```

### 5.3 로그아웃 (`POST /api/auth/session/logout`)

```
Client                        Controller                   Session Store
   │                               │                            │
   │── Cookie: SESSION ───────────>│                            │
   │                               │                            │
   │                               │  session.invalidate()      │
   │                               │──── 세션 삭제 ────────────>│
   │                               │                            │
   │<── { success } ───────────────│                            │
   │    (세션 쿠키 무효화)          │                            │
```

---

## 6. SecurityConfig 구성

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
            // 1. CSRF 비활성화 (JWT 사용)
            .csrf(AbstractHttpConfigurer::disable)

            // 2. CORS 설정
            .cors(cors -> cors.configurationSource(...))

            // 3. 세션 정책
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )

            // 4. URL 권한 설정
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login", ...).permitAll()
                .anyRequest().authenticated()
            )

            // 5. JWT 필터 추가
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}
```

---

## 7. 인증 컴포넌트 관계

```
┌─────────────────────────────────────────────────────────────┐
│                Authentication Components                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  SecurityConfig      │
│  @Configuration      │
└──────────┬───────────┘
           │
           │ creates
           ▼
┌──────────────────────┐        ┌──────────────────────┐
│ SecurityFilterChain  │───────>│ JwtAuthenticationFilter│
│                      │        │ @Component            │
└──────────────────────┘        └──────────┬───────────┘
                                           │
                                           │ uses
                                           ▼
┌──────────────────────┐        ┌──────────────────────┐
│ AuthenticationManager │<──────│ JwtTokenProvider     │
│                      │        │ @Component            │
└──────────┬───────────┘        └──────────────────────┘
           │
           │ delegates to
           ▼
┌──────────────────────┐        ┌──────────────────────┐
│DaoAuthenticationProvider│────>│PasswordEncoder       │
│                      │        │ BCryptPasswordEncoder │
└──────────┬───────────┘        └──────────────────────┘
           │
           │ uses
           ▼
┌──────────────────────┐        ┌──────────────────────┐
│ UserDetailsService   │───────>│ UserRepository       │
│ CustomUserDetailsService│     │ JpaRepository        │
└──────────────────────┘        └──────────────────────┘
```

---

## 8. JWT 토큰 구조

```
┌─────────────────────────────────────────────────────────────┐
│                      JWT Structure                           │
└─────────────────────────────────────────────────────────────┘

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxNjE2MjM5OTIyfQ.signature

├─────────── Header ───────────┤├─────────── Payload ───────────┤├── Signature ──┤


Header (Base64):
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload (Base64):
{
  "sub": "1",              // 사용자 ID
  "email": "user@example.com",
  "type": "access",        // access | refresh
  "iat": 1616239022,       // 발급 시간
  "exp": 1616239922        // 만료 시간
}

Signature:
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

---

## 9. 예외 처리 흐름

```
┌─────────────────────────────────────────────────────────────┐
│               Exception Handling Flow                        │
└─────────────────────────────────────────────────────────────┘

Exception 발생
     │
     ▼
┌────────────────────────────────┐
│     @RestControllerAdvice      │
│     GlobalExceptionHandler     │
└────────────────────────────────┘
     │
     ├── MethodArgumentNotValidException ──> 400 Bad Request
     │   (입력 검증 실패)
     │
     ├── AuthenticationException ──────────> 401 Unauthorized
     │   (인증 실패)
     │
     ├── BadCredentialsException ──────────> 401 Unauthorized
     │   (잘못된 자격 증명)
     │
     ├── IllegalArgumentException ─────────> 400 Bad Request
     │   (비즈니스 로직 오류)
     │
     └── Exception ────────────────────────> 500 Internal Server Error
         (기타 예외)
```

---

## 10. JWT vs Session 비교

| 항목 | JWT | Session |
|------|-----|---------|
| **상태 관리** | Stateless | Stateful |
| **저장 위치** | 클라이언트 | 서버 (JDBC) |
| **전송 방식** | Authorization Header | Cookie (SESSION) |
| **확장성** | 서버 확장 용이 | 세션 동기화 필요 |
| **로그아웃** | 토큰 만료까지 유효 | 즉시 무효화 |
| **Spring 설정** | JwtAuthenticationFilter | Spring Session JDBC |
| **인증 정보 접근** | @AuthenticationPrincipal | HttpSession |

---

## 11. 보안 레이어

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
└─────────────────────────────────────────────────────────────┘

[HTTP 보안]
  └── CORS 설정
      └── allowCredentials: true (쿠키 허용)

[인증]
  ├── JwtAuthenticationFilter
  │   └── Bearer 토큰 검증
  └── DaoAuthenticationProvider
      └── UserDetailsService + PasswordEncoder

[비밀번호 보안]
  └── BCryptPasswordEncoder
      ├── 자동 Salt 생성
      └── Cost Factor 조절

[입력 검증]
  └── @Valid + Bean Validation
      ├── @NotBlank
      ├── @Email
      └── @Size

[예외 처리]
  └── @RestControllerAdvice
      └── 상세 에러 정보 숨김
```

---

## 12. API 엔드포인트 요약

### JWT 인증

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| POST | `/api/auth/register` | X | 회원가입 |
| POST | `/api/auth/login` | X | JWT 로그인 |
| POST | `/api/auth/refresh` | X | 토큰 갱신 |
| GET | `/api/auth/me` | JWT | 내 정보 조회 |

### Session 인증

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| POST | `/api/auth/session/login` | X | 세션 로그인 |
| POST | `/api/auth/session/logout` | Session | 세션 로그아웃 |
| GET | `/api/auth/session/me` | Session | 내 정보 조회 |

---

## 13. 주요 어노테이션

| 어노테이션 | 위치 | 설명 |
|-----------|------|------|
| `@SpringBootApplication` | Main Class | 자동 설정 + 컴포넌트 스캔 |
| `@RestController` | Controller | REST API 컨트롤러 |
| `@Service` | Service | 서비스 레이어 빈 |
| `@Repository` | Repository | 데이터 액세스 빈 |
| `@Entity` | Entity | JPA 엔티티 |
| `@Configuration` | Config | 설정 클래스 |
| `@EnableWebSecurity` | Security Config | Spring Security 활성화 |
| `@Valid` | Parameter | 입력 검증 활성화 |
| `@Transactional` | Method | 트랜잭션 관리 |
| `@AuthenticationPrincipal` | Parameter | 인증된 사용자 주입 |
| `@RestControllerAdvice` | Exception Handler | 전역 예외 처리 |

---

## 14. 의존성 주입 (DI)

```
┌─────────────────────────────────────────────────────────────┐
│               Dependency Injection Flow                      │
└─────────────────────────────────────────────────────────────┘

Spring IoC Container
         │
         │ scans @Component, @Service, @Repository, @Controller
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Bean Registry                           │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ AuthController  │  │ AuthService     │                   │
│  │ @RestController │  │ @Service        │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           │ @RequiredArgsConstructor (Lombok)               │
│           │ 생성자 주입                                      │
│           ▼                    ▼                             │
│  ┌─────────────────────────────────────────┐                │
│  │ private final AuthService authService;  │                │
│  │ private final UserRepository userRepo;  │                │
│  │ private final PasswordEncoder encoder;  │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```
