# Auth-NestJS 인증 라이프사이클

## 1. 애플리케이션 부트스트랩

```
┌─────────────────────────────────────────────────────────────┐
│                   NestJS Bootstrap Flow                      │
└─────────────────────────────────────────────────────────────┘

NestFactory.create(AppModule)
       ↓
┌──────────────────────────────────┐
│         Module Loading           │
│  ┌────────────────────────────┐  │
│  │ ConfigModule (환경변수)    │  │
│  │ TypeOrmModule (DB 연결)    │  │
│  │ ThrottlerModule (Rate Limit)│  │
│  │ UsersModule               │  │
│  │ AuthModule                │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│      Global Middleware Setup     │
│  - helmet()                     │
│  - enableCors()                 │
│  - session()                    │
│  - ValidationPipe               │
│  - AllExceptionsFilter          │
└──────────────────────────────────┘
       ↓
app.listen(PORT)
```

---

## 2. 모듈 의존성 구조

```
┌─────────────────────────────────────────────────────────────┐
│                         AppModule                            │
├─────────────────────────────────────────────────────────────┤
│  imports:                                                    │
│  ├── ConfigModule.forRoot()     → 환경변수 관리              │
│  ├── TypeOrmModule.forRootAsync() → PostgreSQL 연결          │
│  ├── ThrottlerModule.forRoot()  → Rate Limiting             │
│  ├── UsersModule                → 사용자 CRUD                │
│  └── AuthModule                 → 인증 로직                  │
│                                                              │
│  providers:                                                  │
│  └── APP_GUARD: ThrottlerGuard  → 전역 Rate Limiting        │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
┌─────────────────────┐               ┌─────────────────────┐
│     UsersModule     │               │     AuthModule      │
├─────────────────────┤               ├─────────────────────┤
│ providers:          │               │ imports:            │
│ └── UsersService    │◄──────────────│ ├── UsersModule     │
│                     │               │ ├── PassportModule  │
│ exports:            │               │ └── JwtModule       │
│ └── UsersService    │               │                     │
└─────────────────────┘               │ providers:          │
                                      │ ├── AuthService     │
                                      │ ├── JwtStrategy     │
                                      │ └── LocalStrategy   │
                                      └─────────────────────┘
```

---

## 3. 요청 처리 파이프라인

```
┌─────────────────────────────────────────────────────────────┐
│                  NestJS Request Pipeline                     │
└─────────────────────────────────────────────────────────────┘

Request
   │
   ▼
┌──────────────┐
│  Middleware  │  → helmet, cors, session
└──────────────┘
   │
   ▼
┌──────────────┐
│    Guard     │  → JwtAuthGuard, LocalAuthGuard, SessionAuthGuard
└──────────────┘
   │
   ▼
┌──────────────┐
│ Interceptor  │  → (Before)
└──────────────┘
   │
   ▼
┌──────────────┐
│    Pipe      │  → ValidationPipe (DTO 검증)
└──────────────┘
   │
   ▼
┌──────────────┐
│   Handler    │  → Controller Method
└──────────────┘
   │
   ▼
┌──────────────┐
│ Interceptor  │  → (After)
└──────────────┘
   │
   ▼
┌──────────────┐
│   Filter     │  → AllExceptionsFilter (에러 처리)
└──────────────┘
   │
   ▼
Response
```

---

## 4. JWT 인증 라이프사이클

### 4.1 회원가입 (`POST /api/auth/register`)

```
Client                        Controller                    Service                      Database
   │                               │                           │                            │
   │── { email, password, name } ─>│                           │                            │
   │                               │                           │                            │
   │                               │  [ValidationPipe]         │                            │
   │                               │  RegisterDto 검증         │                            │
   │                               │                           │                            │
   │                               │── register(dto) ─────────>│                            │
   │                               │                           │── existsByEmail() ────────>│
   │                               │                           │<───── true/false ──────────│
   │                               │                           │                            │
   │                               │                           │  [비밀번호 해싱 - bcrypt]   │
   │                               │                           │── create(user) ───────────>│
   │                               │                           │<───── user ────────────────│
   │                               │                           │                            │
   │                               │                           │  [JWT 토큰 생성]            │
   │                               │<── { user, tokens } ──────│                            │
   │<── { success, user, tokens } ─│                           │                            │
```

### 4.2 로그인 (`POST /api/auth/login`)

```
Client                     LocalAuthGuard              LocalStrategy                AuthService
   │                            │                           │                           │
   │── { email, password } ────>│                           │                           │
   │                            │                           │                           │
   │                            │── validate(email, pwd) ──>│                           │
   │                            │                           │── validateUser() ────────>│
   │                            │                           │                           │
   │                            │                           │  [findByEmail + bcrypt]   │
   │                            │                           │<──── user | null ─────────│
   │                            │                           │                           │
   │                            │<──── user ────────────────│                           │
   │                            │                           │                           │
   │                            │  req.user = user          │                           │
   │                            │                           │                           │
   │                            │                           │                           │
   │                       Controller                       │                           │
   │                            │                           │                           │
   │                            │── login(user) ───────────────────────────────────────>│
   │                            │                                                       │
   │                            │  [generateTokens()]                                   │
   │                            │<────────── { accessToken, refreshToken } ─────────────│
   │                            │                                                       │
   │<── { user, tokens } ───────│                                                       │
```

### 4.3 인증된 요청 (`GET /api/auth/me`)

```
Client                      JwtAuthGuard               JwtStrategy                  Controller
   │                            │                           │                           │
   │── Authorization: Bearer ──>│                           │                           │
   │      <accessToken>         │                           │                           │
   │                            │                           │                           │
   │                            │  [토큰 추출]               │                           │
   │                            │  ExtractJwt.fromAuthHeaderAsBearerToken()             │
   │                            │                           │                           │
   │                            │  [토큰 검증]               │                           │
   │                            │  - 서명 검증               │                           │
   │                            │  - 만료 시간 확인          │                           │
   │                            │                           │                           │
   │                            │── validate(payload) ─────>│                           │
   │                            │                           │                           │
   │                            │                           │  [사용자 조회]             │
   │                            │                           │  findById(payload.sub)   │
   │                            │                           │                           │
   │                            │<──── { id, email, name } ─│                           │
   │                            │                           │                           │
   │                            │  req.user = user          │                           │
   │                            │───────────────────────────────────────────────────────>│
   │                            │                           │                           │
   │                            │                           │        @CurrentUser()     │
   │                            │                           │        user 추출          │
   │                            │                           │                           │
   │<────────────────────────────────────────────────────────────── { user } ───────────│
```

### 4.4 토큰 갱신 (`POST /api/auth/refresh`)

```
Client                        Controller                    AuthService
   │                               │                           │
   │── { refreshToken } ──────────>│                           │
   │                               │                           │
   │                               │── refreshTokens(token) ──>│
   │                               │                           │
   │                               │                           │  [Refresh Token 검증]
   │                               │                           │  - jwtService.verify()
   │                               │                           │  - type === 'refresh' 확인
   │                               │                           │
   │                               │                           │  [사용자 존재 확인]
   │                               │                           │  findById(payload.sub)
   │                               │                           │
   │                               │                           │  [새 토큰 생성]
   │                               │                           │  generateTokens()
   │                               │                           │
   │                               │<── { accessToken, ────────│
   │                               │      refreshToken }       │
   │<── { tokens } ────────────────│                           │
```

---

## 5. Session 인증 라이프사이클

### 5.1 로그인 (`POST /api/auth/session/login`)

```
Client                     LocalAuthGuard              Controller                Session Store
   │                            │                           │                           │
   │── { email, password } ────>│                           │                           │
   │                            │                           │                           │
   │                            │  [LocalStrategy 검증]      │                           │
   │                            │  req.user = user          │                           │
   │                            │                           │                           │
   │                            │──────────────────────────>│                           │
   │                            │                           │                           │
   │                            │                           │  req.session.userId = id  │
   │                            │                           │  req.session.email = email│
   │                            │                           │── 세션 저장 ─────────────>│
   │                            │                           │                           │
   │<──── Set-Cookie: ──────────────────────────────────────│                           │
   │      connect.sid           │                           │                           │
   │      { user }              │                           │                           │
```

### 5.2 인증된 요청 (`GET /api/auth/session/me`)

```
Client                    express-session           SessionAuthGuard             Controller
   │                            │                           │                           │
   │── Cookie: connect.sid ────>│                           │                           │
   │                            │                           │                           │
   │                            │  [세션 조회]               │                           │
   │                            │  req.session 복원         │                           │
   │                            │──────────────────────────>│                           │
   │                            │                           │                           │
   │                            │                           │  [req.session.userId 확인]│
   │                            │                           │                           │
   │                            │                           │  req.user = {             │
   │                            │                           │    id: session.userId,    │
   │                            │                           │    email: session.email   │
   │                            │                           │  }                        │
   │                            │                           │──────────────────────────>│
   │                            │                           │                           │
   │<────────────────────────────────────────────────────────────── { user } ───────────│
```

### 5.3 로그아웃 (`POST /api/auth/session/logout`)

```
Client                    SessionAuthGuard             Controller                Session Store
   │                            │                           │                           │
   │── Cookie: connect.sid ────>│                           │                           │
   │                            │                           │                           │
   │                            │  [세션 확인]               │                           │
   │                            │──────────────────────────>│                           │
   │                            │                           │                           │
   │                            │                           │  req.session.destroy()    │
   │                            │                           │── 세션 삭제 ─────────────>│
   │                            │                           │                           │
   │<──── { success } ──────────────────────────────────────│                           │
   │      (쿠키 무효화)          │                           │                           │
```

---

## 6. Passport Strategy 패턴

```
┌─────────────────────────────────────────────────────────────┐
│                    Passport Strategy Flow                    │
└─────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  AuthGuard      │
                    │  ('strategy')   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ PassportStrategy │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │LocalStrategy │ │ JwtStrategy  │ │SessionGuard  │
    │   ('local')  │ │   ('jwt')    │ │  (Custom)    │
    └──────────────┘ └──────────────┘ └──────────────┘
            │                │
            ▼                ▼
    ┌──────────────┐ ┌──────────────┐
    │  validate()  │ │  validate()  │
    │ email + pwd  │ │   payload    │
    └──────────────┘ └──────────────┘
            │                │
            └────────┬───────┘
                     ▼
              req.user = user
```

---

## 7. Guard 종류 및 역할

| Guard | Strategy | 용도 | 검증 방식 |
|-------|----------|------|----------|
| `LocalAuthGuard` | LocalStrategy | 로그인 | email + password |
| `JwtAuthGuard` | JwtStrategy | API 인증 | Authorization Header |
| `SessionAuthGuard` | Custom | 세션 인증 | Cookie (connect.sid) |
| `ThrottlerGuard` | - | Rate Limiting | 요청 횟수 제한 |

---

## 8. DTO 검증 흐름 (ValidationPipe)

```
Request Body                  ValidationPipe                    Controller
     │                              │                               │
     │── { email, password } ──────>│                               │
     │                              │                               │
     │                              │  [class-transformer]          │
     │                              │  plainToClass(RegisterDto)    │
     │                              │                               │
     │                              │  [class-validator]            │
     │                              │  @IsEmail() 검증               │
     │                              │  @IsString() 검증              │
     │                              │  @MinLength() 검증             │
     │                              │                               │
     │                              │  [whitelist: true]            │
     │                              │  정의되지 않은 속성 제거        │
     │                              │                               │
     │                              │── RegisterDto ───────────────>│
     │                              │                               │
```

**RegisterDto 예시:**
```typescript
export class RegisterDto {
  @IsEmail({}, { message: '유효한 이메일을 입력해주세요' })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}
```

---

## 9. JWT vs Session 비교

| 항목 | JWT | Session |
|------|-----|---------|
| **상태 관리** | Stateless (클라이언트) | Stateful (서버) |
| **저장 위치** | 클라이언트 (localStorage/Memory) | 서버 (PostgreSQL) |
| **확장성** | 서버 확장 용이 | 세션 동기화 필요 |
| **로그아웃** | 토큰 만료까지 유효 | 즉시 무효화 가능 |
| **Guard** | JwtAuthGuard | SessionAuthGuard |
| **Strategy** | JwtStrategy | Custom Guard |
| **전송 방식** | Authorization Header | Cookie |

---

## 10. 보안 레이어

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
└─────────────────────────────────────────────────────────────┘

[HTTP 보안 - Helmet]
  ├── X-XSS-Protection
  ├── X-Content-Type-Options
  ├── Strict-Transport-Security
  └── X-Frame-Options

[Rate Limiting - ThrottlerModule]
  ├── short:  1초당 3회
  ├── medium: 10초당 20회
  └── long:   1분당 100회

[인증 - Passport]
  ├── LocalStrategy: bcrypt 비밀번호 검증
  └── JwtStrategy: 토큰 서명 검증

[입력 검증 - ValidationPipe]
  ├── whitelist: 허용된 속성만
  ├── forbidNonWhitelisted: 미허용 속성 에러
  └── transform: DTO 타입 변환

[Session 보안]
  ├── httpOnly: XSS 방지
  ├── secure: HTTPS 전용 (production)
  └── sameSite: CSRF 방지
```

---

## 11. API 엔드포인트 요약

### JWT 인증

| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| POST | `/api/auth/register` | - | 회원가입 |
| POST | `/api/auth/login` | LocalAuthGuard | JWT 로그인 |
| POST | `/api/auth/refresh` | - | 토큰 갱신 |
| GET | `/api/auth/me` | JwtAuthGuard | 내 정보 조회 |

### Session 인증

| Method | Endpoint | Guard | 설명 |
|--------|----------|-------|------|
| POST | `/api/auth/session/login` | LocalAuthGuard | 세션 로그인 |
| POST | `/api/auth/session/logout` | SessionAuthGuard | 세션 로그아웃 |
| GET | `/api/auth/session/me` | SessionAuthGuard | 내 정보 조회 |

---

## 12. 주요 데코레이터

| 데코레이터 | 위치 | 설명 |
|-----------|------|------|
| `@Controller()` | Class | 라우트 접두사 설정 |
| `@Get()`, `@Post()` | Method | HTTP 메서드 매핑 |
| `@UseGuards()` | Method/Class | 가드 적용 |
| `@Body()` | Parameter | Request Body 추출 |
| `@CurrentUser()` | Parameter | req.user 추출 (커스텀) |
| `@Injectable()` | Class | 의존성 주입 대상 |
