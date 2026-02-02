/**
 * JWT (JSON Web Token) 설정
 *
 * 【학습 개념: JWT란?】
 * JWT는 세 부분으로 구성됩니다: Header.Payload.Signature
 *
 * 1. Header: 토큰 타입과 알고리즘 정보
 *    {"alg": "HS256", "typ": "JWT"}
 *
 * 2. Payload: 실제 데이터 (Claims)
 *    {"userId": 1, "email": "user@example.com", "exp": 1234567890}
 *    ⚠️ 주의: Payload는 Base64로 인코딩될 뿐, 암호화되지 않습니다!
 *    → 비밀번호 같은 민감한 정보는 절대 넣지 마세요
 *
 * 3. Signature: 위변조 방지용 서명
 *    HMACSHA256(base64(header) + "." + base64(payload), secret)
 *
 * 【학습 개념: Access Token vs Refresh Token】
 * - Access Token: 짧은 유효기간 (15분), API 요청에 사용
 * - Refresh Token: 긴 유효기간 (7일), Access Token 갱신에 사용
 * - 왜 둘을 분리할까?
 *   → Access Token이 탈취당해도 15분 뒤 만료됨
 *   → Refresh Token은 서버에서 무효화 가능 (블랙리스트)
 */

module.exports = {
  // Access Token 설정
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },

  // Refresh Token 설정
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // JWT 옵션
  options: {
    algorithm: 'HS256',  // HMAC SHA-256 알고리즘
    issuer: 'auth-learning-project',  // 토큰 발급자
  },
};
