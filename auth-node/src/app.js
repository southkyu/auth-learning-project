/**
 * Express 앱 설정
 *
 * 【학습 개념: 미들웨어 실행 순서】
 *
 * Express에서 미들웨어는 등록 순서대로 실행됩니다:
 *
 * 요청 → [helmet] → [cors] → [rateLimit] → [json parser] → [session] → [routes] → 응답
 *                                                                            ↓
 *                                                                    [error handler]
 *
 * 순서가 중요한 이유:
 * 1. 보안 미들웨어(helmet)는 가장 먼저
 * 2. 파싱 미들웨어(json)는 라우트 전에
 * 3. 에러 핸들러는 가장 마지막에
 *
 * 【학습 개념: 보안 미들웨어들】
 *
 * helmet: HTTP 헤더 보안 설정
 * - X-XSS-Protection
 * - X-Content-Type-Options
 * - Strict-Transport-Security 등
 *
 * cors: Cross-Origin Resource Sharing
 * - 다른 도메인에서 API 호출 허용/차단
 *
 * rate-limit: 요청 횟수 제한
 * - DoS/무차별 대입 공격 방지
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// 설정
const { createSessionMiddleware } = require('./config/session');

// 라우터
const authRoutes = require('./modules/auth/auth.routes');

// 에러 핸들러
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');

const app = express();

/**
 * ========================================
 * 보안 미들웨어
 * ========================================
 */

// Helmet: 보안 HTTP 헤더 설정
// 【학습 포인트】 기본 설정만으로도 많은 공격 방지
app.use(helmet());

// CORS 설정
// 【학습 포인트】 개발 환경에서는 모든 origin 허용, 운영에서는 제한
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',')  // 운영: 특정 도메인만
    : true,  // 개발: 모든 origin 허용
  credentials: true,  // 쿠키 전송 허용 (Session 인증에 필요)
}));

// Rate Limiting - 인증 관련 엔드포인트에 더 엄격한 제한
// 【학습 포인트】 무차별 대입 공격 방지
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 5,                      // 최대 5회
  message: {
    success: false,
    error: {
      message: '너무 많은 로그인 시도입니다. 15분 후 다시 시도해주세요.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 일반 API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 100,                   // 최대 100회
  message: {
    success: false,
    error: {
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      statusCode: 429,
    },
  },
});

/**
 * ========================================
 * 파싱 미들웨어
 * ========================================
 */

// JSON 파싱
// 【학습 포인트】 req.body에서 JSON 데이터를 사용하려면 필수
app.use(express.json());

// URL-encoded 파싱 (폼 데이터용)
app.use(express.urlencoded({ extended: true }));

/**
 * ========================================
 * Session 미들웨어
 * ========================================
 */

// Session 미들웨어는 DB 연결 후 설정
// server.js에서 initializeApp() 호출 시 설정됨

/**
 * Session 미들웨어 초기화 함수
 * 데이터베이스 연결 후 호출됩니다
 */
const initializeSessionMiddleware = () => {
  app.use(createSessionMiddleware());
  console.log('✅ Session 미들웨어 초기화 완료');
};

/**
 * ========================================
 * 라우트 미들웨어 초기화 함수
 * ========================================
 */
const initializeRoutes = () => {
  /**
   * ========================================
   * 로깅 미들웨어 (개발용)
   * ========================================
   */
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`📨 ${req.method} ${req.url}`);
      next();
    });
  }

  /**
   * ========================================
   * 헬스 체크 엔드포인트
   * ========================================
   */
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: '서버가 정상 작동 중입니다',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * ========================================
   * API 라우트
   * ========================================
   */

  // 로그인/회원가입 엔드포인트에 엄격한 rate limit 적용
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/session/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  // 인증 API
  app.use('/api/auth', apiLimiter, authRoutes);

  /**
   * ========================================
   * 에러 핸들링
   * ========================================
   */

  // 404 핸들러 - 등록되지 않은 라우트
  app.use(notFoundHandler);

  // 전역 에러 핸들러 - 모든 에러 처리
  app.use(globalErrorHandler);

  console.log('✅ 라우트 초기화 완료');
};

module.exports = {
  app,
  initializeSessionMiddleware,
  initializeRoutes,
};
