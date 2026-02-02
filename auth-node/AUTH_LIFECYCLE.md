# Auth-Node 인증 라이프사이클

## 1. 서버 시작 라이프사이클

```
┌─────────────────────────────────────────────────────────────┐
│                    Server Startup Flow                       │
└─────────────────────────────────────────────────────────────┘

dotenv.config()          환경변수 로드
       ↓
initializeDatabase()     PostgreSQL 연결 & 테이블 생성
       ↓
initializeSessionMiddleware()  Session 미들웨어 설정
       ↓
initializeRoutes()       라우트 & 에러핸들러 등록
       ↓
app.listen(PORT)         서버 시작
```

---

## 2. 요청 처리 미들웨어 순서

```
Request → [helmet] → [cors] → [rateLimit] → [json parser] → [session] → [routes] → Response
                                                                              ↓
                                                                      [error handler]
```

| 미들웨어 | 역할 |
|---------|------|
| `helmet` | HTTP 보안 헤더 설정 (XSS, HSTS 등) |
| `cors` | Cross-Origin 요청 허용 설정 |
| `rateLimit` | 요청 횟수 제한 (DoS 방지) |
| `express.json()` | JSON 바디 파싱 |
| `session` | 세션 미들웨어 |

---

## 3. JWT 인증 라이프사이클

### 3.1 회원가입 (`POST /api/auth/register`)

```
Client                          Server                         Database
   │                               │                               │
   │──── { email, password } ─────>│                               │
   │                               │──── emailExists(email) ──────>│
   │                               │<──────── true/false ──────────│
   │                               │                               │
   │                               │  [비밀번호 해싱 - bcrypt]      │
   │                               │──── create(user) ────────────>│
   │                               │<──────── user ────────────────│
   │<──── { success, user } ───────│                               │
```

### 3.2 로그인 (`POST /api/auth/login`)

```
Client                          Server                         Database
   │                               │                               │
   │──── { email, password } ─────>│                               │
   │                               │──── findByEmail(email) ──────>│
   │                               │<──────── user ────────────────│
   │                               │                               │
   │                               │  [bcrypt.compare() 비밀번호 검증]
   │                               │                               │
   │                               │  [JWT 토큰 생성]               │
   │                               │  - Access Token (15분)        │
   │                               │  - Refresh Token (7일)        │
   │                               │                               │
   │<── { user, accessToken, ─────│                               │
   │      refreshToken }          │                               │
```

### 3.3 인증된 요청 (`GET /api/auth/me`)

```
Client                          authJWT 미들웨어              Controller
   │                               │                               │
   │── Authorization: Bearer ─────>│                               │
   │      <accessToken>            │                               │
   │                               │                               │
   │                               │  [토큰 추출 & 검증]            │
   │                               │  - jwt.verify()               │
   │                               │  - 만료 확인                   │
   │                               │                               │
   │                               │──── findById(userId) ────────>│
   │                               │<──────── user ────────────────│
   │                               │                               │
   │                               │  req.user = user              │
   │                               │────────── next() ────────────>│
   │<──────────────────────────────────── { user } ────────────────│
```

### 3.4 토큰 갱신 (`POST /api/auth/refresh`)

```
Client                          Server                         Database
   │                               │                               │
   │──── { refreshToken } ────────>│                               │
   │                               │                               │
   │                               │  [Refresh Token 검증]          │
   │                               │  - jwt.verify()               │
   │                               │                               │
   │                               │──── findById(userId) ────────>│
   │                               │<──────── user ────────────────│
   │                               │                               │
   │                               │  [새 Access Token 생성]        │
   │                               │                               │
   │<──── { accessToken } ────────│                               │
```

---

## 4. Session 인증 라이프사이클

### 4.1 로그인 (`POST /api/auth/session/login`)

```
Client                          Server                      Session Store (DB)
   │                               │                               │
   │──── { email, password } ─────>│                               │
   │                               │                               │
   │                               │  [사용자 검증]                 │
   │                               │                               │
   │                               │  req.session.userId = id      │
   │                               │──── 세션 저장 ───────────────>│
   │                               │                               │
   │<──── Set-Cookie: sessionId ──│                               │
   │      { user }                 │                               │
```

### 4.2 인증된 요청 (`GET /api/auth/session/me`)

```
Client                      express-session          authSession 미들웨어
   │                               │                               │
   │── Cookie: sessionId ─────────>│                               │
   │                               │                               │
   │                               │  [Session Store에서 조회]      │
   │                               │  req.session 복원             │
   │                               │────────────────────────────>│
   │                               │                               │
   │                               │           [req.session.userId 확인]
   │                               │           [findById() 사용자 조회]
   │                               │           req.user = user     │
   │                               │                               │
   │<──────────────────────────────────── { user } ────────────────│
```

### 4.3 로그아웃 (`POST /api/auth/session/logout`)

```
Client                          Server                      Session Store
   │                               │                               │
   │── Cookie: sessionId ─────────>│                               │
   │                               │                               │
   │                               │  req.session.destroy()        │
   │                               │──── 세션 삭제 ───────────────>│
   │                               │                               │
   │<── Set-Cookie: sessionId="" ─│                               │
   │    (쿠키 삭제)                │                               │
```

---

## 5. JWT vs Session 비교

| 항목 | JWT | Session |
|------|-----|---------|
| **상태 저장** | Stateless (클라이언트) | Stateful (서버) |
| **확장성** | 서버 확장 용이 | 서버 간 세션 동기화 필요 |
| **로그아웃** | 토큰 만료까지 유효 | 즉시 무효화 가능 |
| **저장 위치** | 클라이언트 (localStorage/Cookie) | 서버 (메모리/DB) |
| **보안** | 토큰 탈취 시 만료까지 유효 | Session ID 탈취 시 서버에서 무효화 가능 |

---

## 6. 보안 포인트

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
└─────────────────────────────────────────────────────────────┘

[비밀번호]
  └── bcrypt 해싱 (Salt + Cost Factor)
  └── Rainbow Table 공격 방지

[Rate Limiting]
  └── 로그인: 15분당 5회
  └── 일반 API: 15분당 100회

[JWT 보안]
  └── Access Token: 짧은 만료 (15분)
  └── Refresh Token: 긴 만료 (7일)
  └── 민감 정보 미포함

[Session 보안]
  └── httpOnly: XSS 방지
  └── secure: HTTPS 전용
  └── sameSite: CSRF 방지
```

---

## 7. API 엔드포인트 요약

### JWT 인증

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| POST | `/api/auth/register` | 회원가입 | X |
| POST | `/api/auth/login` | 로그인 | X |
| POST | `/api/auth/refresh` | 토큰 갱신 | X |
| GET | `/api/auth/me` | 내 정보 조회 | O (JWT) |

### Session 인증

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|----------|
| POST | `/api/auth/session/login` | 로그인 | X |
| POST | `/api/auth/session/logout` | 로그아웃 | O (Session) |
| GET | `/api/auth/session/me` | 내 정보 조회 | O (Session) |
