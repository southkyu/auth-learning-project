/**
 * 인증 라우터 - API 엔드포인트 정의
 *
 * 【학습 개념: Express Router】
 *
 * Router는 관련된 라우트를 그룹화합니다:
 * - 코드 구조화
 * - 미들웨어 공유
 * - 라우트 분리
 *
 * 【학습 개념: RESTful API 설계】
 *
 * REST는 자원(Resource) 중심의 API 설계 방식:
 *
 * - GET: 조회 (부수 효과 없음)
 * - POST: 생성, 또는 동작 실행
 * - PUT/PATCH: 수정
 * - DELETE: 삭제
 *
 * 인증 API는 약간 특별합니다:
 * - POST /login: "로그인 세션 생성"으로 볼 수 있음
 * - POST /logout: "로그인 세션 삭제"이지만 POST 사용 (보안상)
 */

const express = require('express');
const router = express.Router();

// 컨트롤러
const authController = require('./auth.controller');

// 검증 미들웨어
const {
  registerValidation,
  loginValidation,
  refreshValidation,
} = require('./auth.validation');

// 인증 미들웨어
const { authJWT } = require('../../middlewares/authJWT');
const { authSession } = require('../../middlewares/authSession');

/**
 * ========================================
 * JWT 기반 인증 API
 * ========================================
 */

/**
 * POST /api/auth/register
 * 회원가입
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "Password123",
 *   "confirmPassword": "Password123",
 *   "name": "홍길동"
 * }
 */
router.post('/register', registerValidation, authController.register);

/**
 * POST /api/auth/login
 * JWT 로그인
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "Password123"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": {...},
 *     "tokens": {
 *       "accessToken": "...",
 *       "refreshToken": "..."
 *     }
 *   }
 * }
 */
router.post('/login', loginValidation, authController.login);

/**
 * POST /api/auth/refresh
 * Access Token 갱신
 *
 * Request Body:
 * {
 *   "refreshToken": "..."
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "accessToken": "..."
 *   }
 * }
 */
router.post('/refresh', refreshValidation, authController.refresh);

/**
 * GET /api/auth/me
 * 내 정보 조회 (JWT 인증 필요)
 *
 * Headers:
 * Authorization: Bearer <accessToken>
 */
router.get('/me', authJWT, authController.getMe);

/**
 * ========================================
 * Session 기반 인증 API
 * ========================================
 */

/**
 * POST /api/auth/session/login
 * Session 로그인
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "Password123"
 * }
 *
 * Response: 쿠키에 sessionId 자동 설정
 */
router.post('/session/login', loginValidation, authController.sessionLogin);

/**
 * POST /api/auth/session/logout
 * Session 로그아웃
 */
router.post('/session/logout', authSession, authController.sessionLogout);

/**
 * GET /api/auth/session/me
 * 내 정보 조회 (Session 인증 필요)
 *
 * 쿠키의 sessionId로 자동 인증
 */
router.get('/session/me', authSession, authController.sessionGetMe);

module.exports = router;
