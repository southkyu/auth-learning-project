# Node.js 백엔드 인증 시스템 학습 프로젝트

JWT와 Session 두 가지 인증 방식을 구현하며 백엔드 인증 시스템을 학습하는 프로젝트입니다.

## 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken) + Session (express-session)
- **Security**: bcrypt, helmet, cors, express-rate-limit

## 시작하기

### 1. 사전 요구사항

- Node.js 18+ 설치
- PostgreSQL 설치 및 실행

### 2. 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE auth_learning;

# 종료
\q
```

### 3. 환경변수 설정

`.env` 파일의 데이터베이스 설정을 수정하세요:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_learning
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### 4. 의존성 설치 및 실행

```bash
cd auth-learning-project

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 또는 프로덕션 실행
npm start
```

## API 테스트 (curl 예제)

### 회원가입

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "name": "테스트유저"
  }'
```

### JWT 로그인

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

### 내 정보 조회 (JWT)

```bash
# 위에서 받은 accessToken 사용
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 토큰 갱신

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Session 로그인

```bash
curl -X POST http://localhost:3000/api/auth/session/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

### 내 정보 조회 (Session)

```bash
curl -X GET http://localhost:3000/api/auth/session/me \
  -b cookies.txt
```

### Session 로그아웃

```bash
curl -X POST http://localhost:3000/api/auth/session/logout \
  -b cookies.txt
```

## 보안 테스트

### SQL Injection 테스트 (실패해야 정상)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'; DROP TABLE users; --",
    "password": "anything"
  }'
```

### Rate Limiting 테스트

```bash
# 6번 연속 로그인 시도 (5회 초과 시 차단)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}'
  echo ""
done
```

## 프로젝트 구조

```
auth-learning-project/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL 연결 및 Pool 설정
│   │   ├── session.js       # Session 미들웨어 설정
│   │   └── jwt.js           # JWT 설정값
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js  # 인증 API 로직
│   │   │   ├── auth.routes.js      # 라우트 정의
│   │   │   └── auth.validation.js  # 입력 검증 규칙
│   │   └── users/
│   │       └── user.model.js       # User DB 작업
│   ├── middlewares/
│   │   ├── errorHandler.js  # 에러 처리
│   │   ├── authJWT.js       # JWT 인증 미들웨어
│   │   └── authSession.js   # Session 인증 미들웨어
│   ├── utils/
│   │   ├── password.js      # bcrypt 유틸리티
│   │   └── token.js         # JWT 유틸리티
│   ├── app.js               # Express 앱 설정
│   └── server.js            # 서버 진입점
├── .env                     # 환경변수
├── .gitignore
├── package.json
└── README.md
```

## 학습 포인트

### JWT vs Session 비교

| 항목 | Session | JWT |
|------|---------|-----|
| 상태 저장 | 서버 (Stateful) | 클라이언트 (Stateless) |
| 확장성 | 서버 간 동기화 필요 | 확장 용이 |
| 로그아웃 | 즉시 무효화 가능 | 만료까지 유효 |
| 저장 공간 | 서버 메모리/DB | 클라이언트 |

### 보안 구현사항

- **비밀번호**: bcrypt 해싱 (Salt + Cost Factor)
- **SQL Injection**: Parameterized Query
- **XSS**: helmet, escape 처리
- **Brute Force**: Rate Limiting
- **CORS**: 운영 환경에서 허용 도메인 제한
