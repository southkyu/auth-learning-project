/**
 * Session 설정
 *
 * 【학습 개념: Session vs JWT 비교】
 *
 * ┌─────────────────┬─────────────────────┬─────────────────────┐
 * │      항목       │       Session       │        JWT          │
 * ├─────────────────┼─────────────────────┼─────────────────────┤
 * │ 상태 저장       │ 서버에 저장 (Stateful) │ 클라이언트 저장 (Stateless) │
 * │ 확장성          │ 서버 간 동기화 필요    │ 서버 확장 용이        │
 * │ 로그아웃        │ 서버에서 세션 삭제     │ 토큰 만료까지 유효    │
 * │ 보안            │ Session ID만 전송     │ 토큰에 정보 포함      │
 * │ 저장 공간       │ 서버 메모리/DB 사용   │ 서버 부담 없음        │
 * │ 구현 복잡도     │ 상대적으로 간단       │ Refresh Token 등 복잡 │
 * └─────────────────┴─────────────────────┴─────────────────────┘
 *
 * 【학습 개념: Cookie 보안 옵션】
 * - httpOnly: JavaScript로 쿠키 접근 불가 (XSS 방지)
 * - secure: HTTPS에서만 쿠키 전송
 * - sameSite: CSRF 공격 방지
 *   - 'strict': 같은 사이트에서만 쿠키 전송
 *   - 'lax': GET 요청은 허용
 *   - 'none': 모든 요청에 쿠키 전송 (secure 필수)
 */

const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./database');

// Session 미들웨어 생성
const createSessionMiddleware = () => {
  return session({
    // PostgreSQL에 세션 저장
    store: new pgSession({
      pool: pool,
      tableName: 'session',  // 세션 저장 테이블명
      createTableIfMissing: true,
    }),

    // 세션 비밀 키 (쿠키 서명에 사용)
    secret: process.env.SESSION_SECRET,

    // resave: 세션이 수정되지 않아도 다시 저장할지
    // false로 설정하면 불필요한 DB 쓰기 방지
    resave: false,

    // saveUninitialized: 초기화되지 않은 세션도 저장할지
    // false로 설정하면 로그인 전에는 세션 생성 안 함
    saveUninitialized: false,

    // 쿠키 설정
    cookie: {
      // 세션 유효 시간 (밀리초) - 기본 24시간
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000,

      // httpOnly: true면 JavaScript로 쿠키 접근 불가
      // XSS 공격으로부터 보호
      httpOnly: true,

      // secure: true면 HTTPS에서만 쿠키 전송
      // 개발 환경에서는 false, 운영 환경에서는 true
      secure: process.env.NODE_ENV === 'production',

      // sameSite: CSRF 공격 방지
      // 'lax'는 적당한 균형 (일반 링크 클릭은 허용)
      sameSite: 'lax',
    },

    // 세션 ID 쿠키 이름
    name: 'sessionId',
  });
};

module.exports = {
  createSessionMiddleware,
};
