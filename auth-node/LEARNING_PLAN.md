# Node.js 백엔드 로그인 시스템 - 입문자 학습 계획

## 개요
- **목표**: Node.js + Express + PostgreSQL로 인증 시스템 구축하며 학습
- **수준**: 입문자 (기초 개념부터 상세 설명)
- **인증 방식**: JWT와 Session 둘 다 구현 및 비교

---

## 프로젝트 구조

```
auth-learning-project/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL 연결
│   │   ├── session.js           # Session 설정
│   │   └── jwt.js               # JWT 설정
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validation.js
│   │   └── users/
│   │       └── user.model.js
│   ├── middlewares/
│   │   ├── errorHandler.js
│   │   ├── authJWT.js
│   │   └── authSession.js
│   ├── utils/
│   │   ├── password.js          # bcrypt 유틸리티
│   │   └── token.js             # JWT 유틸리티
│   ├── app.js
│   └── server.js
├── .env
└── package.json
```

---

## 학습 단계

### Phase 1: 환경 설정 + Node.js 기초

**학습 개념**:
- Node.js와 npm의 역할
- 환경변수의 중요성 (보안)
- package.json 이해

**실습**:
- 프로젝트 초기화 (`npm init`)
- Express, dotenv 설치
- 기본 서버 실행

**관련 파일**: `package.json`, `.env`, `src/server.js`

---

### Phase 2: Express.js + HTTP 기초

**학습 개념**:
- HTTP Request/Response 사이클
- HTTP 메서드 (GET, POST, PUT, DELETE)
- 미들웨어 개념과 실행 순서
- `next()` 함수의 역할

**실습**:
- Express 앱 설정
- 로깅 미들웨어 작성
- 테스트 라우트 생성

**관련 파일**: `src/app.js`

---

### Phase 3: PostgreSQL 연동

**학습 개념**:
- 관계형 데이터베이스 기초
- Connection Pool 개념
- **SQL Injection 공격과 방지법** (Parameterized Query)

**실습**:
- pg 라이브러리로 DB 연결
- users 테이블 생성
- User 모델 구현 (CRUD)

**관련 파일**: `src/config/database.js`, `src/modules/users/user.model.js`

---

### Phase 4: 비밀번호 보안 - bcrypt

**학습 개념**:
- 해싱 vs 암호화의 차이
- bcrypt 작동 원리 (Salt, Cost Factor)
- Rainbow Table 공격과 Salt의 역할
- 비밀번호 강도 검증

**실습**:
- bcrypt로 비밀번호 해싱
- 비밀번호 검증 함수 구현
- 강도 검증 규칙 구현

**관련 파일**: `src/utils/password.js`

---

### Phase 5: JWT 인증 구현

**학습 개념**:
- JWT 구조 (Header.Payload.Signature)
- JWT가 인증에 사용되는 과정
- Access Token vs Refresh Token
- JWT의 장단점

**실습**:
- JWT 생성/검증 유틸리티
- 회원가입 API
- 로그인 API (토큰 발급)
- 토큰 갱신 API
- JWT 인증 미들웨어

**관련 파일**: `src/config/jwt.js`, `src/utils/token.js`, `src/middlewares/authJWT.js`

---

### Phase 6: Session 인증 구현

**학습 개념**:
- Cookie란 무엇인가
- Session의 개념과 저장소
- Cookie 보안 옵션 (httpOnly, secure, sameSite)
- **JWT vs Session 상세 비교**

**실습**:
- express-session 설정
- PostgreSQL 세션 저장소
- 로그인/로그아웃 API
- Session 인증 미들웨어

**관련 파일**: `src/config/session.js`, `src/middlewares/authSession.js`

---

### Phase 7: 입력 검증 + 에러 핸들링

**학습 개념**:
- 입력 검증의 중요성
- 에러 핸들링 패턴
- 보안적 에러 메시지 처리

**실습**:
- express-validator로 입력 검증
- 커스텀 에러 클래스
- 전역 에러 핸들러

**관련 파일**: `src/modules/auth/auth.validation.js`, `src/middlewares/errorHandler.js`

---

### Phase 8: 보안 강화

**학습 개념**:
- XSS, CSRF 공격 이해
- Rate Limiting
- CORS 설정
- 프로덕션 보안 체크리스트

**실습**:
- Helmet 적용
- Rate limiting 적용
- CORS 설정
- 보안 점검

**관련 파일**: `src/app.js`

---

## 최종 API 목록

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | JWT 로그인 |
| POST | /api/auth/refresh | 토큰 갱신 |
| GET | /api/auth/me | 내 정보 (JWT) |
| POST | /api/auth/session/login | Session 로그인 |
| POST | /api/auth/session/logout | Session 로그아웃 |
| GET | /api/auth/session/me | 내 정보 (Session) |

---

## 검증 방법

### 1. 각 Phase 완료 후
curl 또는 Postman으로 API 테스트

### 2. 보안 검증

**SQL Injection 시도 → 실패 확인**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "'"'"'; DROP TABLE users; --", "password": "test"}'
```

**잘못된 토큰으로 요청 → 401 응답 확인**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer invalid_token"
```

**Rate limiting 테스트 → 5회 초과 시 차단 확인**
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@test.com", "password": "wrong"}'
  echo ""
done
```

### 3. 최종 테스트
전체 인증 플로우 테스트: 회원가입 → 로그인 → 토큰 사용 → 갱신 → 로그아웃

---

## 학습 진행 방식

각 Phase에서:
1. **개념 설명**: 왜 이렇게 하는지 먼저 설명
2. **코드 작성**: 실제 구현하며 주석으로 추가 설명
3. **테스트**: 작성한 코드 동작 확인
4. **질문/피드백**: 이해 안 되는 부분 질문 환영

---

## 필요한 패키지

```bash
# 핵심 패키지
express dotenv pg bcrypt jsonwebtoken express-session connect-pg-simple

# 검증 및 보안
express-validator helmet cors express-rate-limit

# 개발용
nodemon
```

---

## JWT vs Session 상세 비교

### 상태 관리

| 구분 | Session | JWT |
|------|---------|-----|
| 저장 위치 | 서버 (메모리/DB) | 클라이언트 (localStorage/Cookie) |
| 상태 유형 | Stateful | Stateless |
| 서버 부하 | 세션 저장소 필요 | 서버 부담 없음 |

### 확장성

| 구분 | Session | JWT |
|------|---------|-----|
| 수평 확장 | 서버 간 세션 동기화 필요 | 동기화 불필요 |
| 마이크로서비스 | 공유 세션 저장소 필요 | 각 서비스에서 독립 검증 |

### 보안

| 구분 | Session | JWT |
|------|---------|-----|
| 로그아웃 | 즉시 무효화 | 만료까지 유효 (블랙리스트 필요) |
| 탈취 시 | Session ID만 노출 | 토큰 내 정보 노출 가능 |
| 갱신 | 서버에서 자동 관리 | Refresh Token 구현 필요 |

### 사용 추천 상황

**Session 추천**:
- 단일 서버 애플리케이션
- 즉각적인 세션 제어가 필요한 경우
- 전통적인 웹 애플리케이션

**JWT 추천**:
- 마이크로서비스 아키텍처
- 모바일 앱 API
- 서버리스 환경
- 여러 도메인 간 인증 공유

---

## 체크리스트

### Phase 1: 환경 설정
- [ ] Node.js 설치 확인
- [ ] 프로젝트 초기화 완료
- [ ] 환경변수 설정 완료
- [ ] 기본 서버 실행 확인

### Phase 2: Express 기초
- [ ] Express 앱 구조 이해
- [ ] 미들웨어 개념 이해
- [ ] 기본 라우트 동작 확인

### Phase 3: PostgreSQL
- [ ] DB 연결 성공
- [ ] 테이블 생성 완료
- [ ] Parameterized Query 이해

### Phase 4: 비밀번호 보안
- [ ] 해싱 vs 암호화 차이 이해
- [ ] bcrypt 사용법 숙지
- [ ] Salt 역할 이해

### Phase 5: JWT 인증
- [ ] JWT 구조 이해
- [ ] 토큰 생성/검증 구현
- [ ] Access/Refresh Token 이해

### Phase 6: Session 인증
- [ ] Cookie 개념 이해
- [ ] Session 저장소 설정
- [ ] Session vs JWT 차이 이해

### Phase 7: 입력 검증
- [ ] express-validator 사용
- [ ] 에러 핸들러 구현
- [ ] 보안적 에러 처리 이해

### Phase 8: 보안 강화
- [ ] Helmet 적용
- [ ] Rate Limiting 적용
- [ ] CORS 설정 완료
