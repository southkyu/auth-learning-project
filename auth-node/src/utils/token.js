/**
 * JWT 토큰 유틸리티
 *
 * 【학습 개념: JWT 인증 과정】
 *
 * 1. 로그인 요청
 *    클라이언트 → 서버: { email, password }
 *
 * 2. 서버에서 검증 후 토큰 발급
 *    서버 → 클라이언트: { accessToken, refreshToken }
 *
 * 3. 이후 API 요청 시 Access Token 포함
 *    클라이언트 → 서버: Authorization: Bearer <accessToken>
 *
 * 4. Access Token 만료 시 Refresh Token으로 갱신
 *    클라이언트 → 서버: { refreshToken }
 *    서버 → 클라이언트: { accessToken (새것) }
 *
 * 【학습 개념: Bearer 토큰이란?】
 * - HTTP 헤더에 토큰을 담는 표준 방식
 * - 형식: "Authorization: Bearer <토큰>"
 * - "Bearer"는 "소지자"라는 뜻 - 토큰을 가진 사람이 인증됨
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Access Token 생성
 * @param {Object} payload - 토큰에 담을 데이터 (userId, email 등)
 * @returns {string} - 생성된 Access Token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    jwtConfig.accessToken.secret,
    {
      expiresIn: jwtConfig.accessToken.expiresIn,
      algorithm: jwtConfig.options.algorithm,
      issuer: jwtConfig.options.issuer,
    }
  );
};

/**
 * Refresh Token 생성
 * @param {Object} payload - 토큰에 담을 데이터
 * @returns {string} - 생성된 Refresh Token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    jwtConfig.refreshToken.secret,
    {
      expiresIn: jwtConfig.refreshToken.expiresIn,
      algorithm: jwtConfig.options.algorithm,
      issuer: jwtConfig.options.issuer,
    }
  );
};

/**
 * Access Token과 Refresh Token 함께 생성
 * @param {Object} user - 사용자 정보
 * @returns {Object} - { accessToken, refreshToken }
 */
const generateTokens = (user) => {
  // ⚠️ 주의: 민감한 정보(비밀번호 등)는 payload에 넣지 마세요!
  const payload = {
    userId: user.id,
    email: user.email,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Access Token 검증
 * @param {string} token - 검증할 토큰
 * @returns {Object} - { success, data, error }
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.accessToken.secret);
    return { success: true, data: decoded };
  } catch (error) {
    // 【학습 포인트: JWT 에러 종류】
    // - TokenExpiredError: 토큰 만료
    // - JsonWebTokenError: 토큰 형식 오류 또는 서명 불일치
    // - NotBeforeError: 토큰이 아직 활성화되지 않음
    return { success: false, error: error.message };
  }
};

/**
 * Refresh Token 검증
 * @param {string} token - 검증할 토큰
 * @returns {Object} - { success, data, error }
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshToken.secret);
    return { success: true, data: decoded };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Authorization 헤더에서 토큰 추출
 * @param {string} authHeader - "Bearer <token>" 형식의 헤더
 * @returns {string|null} - 추출된 토큰 또는 null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;

  // "Bearer <token>" 형식 확인
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
};
