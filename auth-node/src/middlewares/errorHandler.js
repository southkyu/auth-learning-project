/**
 * 에러 핸들링 미들웨어
 *
 * 【학습 개념: Express 에러 핸들링】
 *
 * Express에서 에러는 두 가지 방식으로 처리됩니다:
 *
 * 1. 동기 에러: Express가 자동으로 catch
 *    app.get('/sync', (req, res) => {
 *      throw new Error('동기 에러');  // 자동으로 에러 핸들러로 전달
 *    });
 *
 * 2. 비동기 에러: next()로 전달 필요
 *    app.get('/async', async (req, res, next) => {
 *      try {
 *        await someAsyncFunction();
 *      } catch (error) {
 *        next(error);  // 명시적으로 에러 핸들러로 전달
 *      }
 *    });
 *
 * 【학습 개념: 에러 핸들러 미들웨어】
 * - 4개의 매개변수를 가집니다: (err, req, res, next)
 * - 일반 미들웨어(3개)와 구분되어 에러 처리에만 사용됩니다
 * - 앱의 마지막에 등록해야 합니다
 *
 * 【보안 개념: 에러 메시지 처리】
 * - 개발 환경: 상세한 에러 정보 노출 (디버깅용)
 * - 운영 환경: 일반적인 메시지만 노출 (보안)
 *   → 상세한 에러 정보는 공격자에게 힌트가 될 수 있음
 */

/**
 * 커스텀 에러 클래스
 * HTTP 상태 코드와 함께 에러를 생성합니다
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;  // 예측 가능한 운영 에러 표시

    // 스택 트레이스에서 이 클래스 제외
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 자주 사용되는 에러 팩토리 함수들
 */
const errors = {
  badRequest: (message = '잘못된 요청입니다') => new AppError(message, 400),
  unauthorized: (message = '인증이 필요합니다') => new AppError(message, 401),
  forbidden: (message = '접근 권한이 없습니다') => new AppError(message, 403),
  notFound: (message = '리소스를 찾을 수 없습니다') => new AppError(message, 404),
  conflict: (message = '이미 존재하는 리소스입니다') => new AppError(message, 409),
  tooMany: (message = '요청이 너무 많습니다') => new AppError(message, 429),
  internal: (message = '서버 내부 오류가 발생했습니다') => new AppError(message, 500),
};

/**
 * 404 Not Found 핸들러
 * 등록되지 않은 경로에 대한 요청 처리
 */
const notFoundHandler = (req, res, next) => {
  next(errors.notFound(`경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`));
};

/**
 * 전역 에러 핸들러
 * 모든 에러를 일관된 형식으로 응답
 */
const globalErrorHandler = (err, req, res, next) => {
  // 기본값 설정
  err.statusCode = err.statusCode || 500;
  err.message = err.message || '서버 내부 오류가 발생했습니다';

  // 개발 환경: 상세 에러 정보
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);

    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
        stack: err.stack,  // 개발 환경에서만 스택 트레이스 노출
      },
    });
  }

  // 운영 환경: 최소한의 에러 정보
  // 운영 에러(isOperational)만 메시지 노출, 그 외는 일반 메시지
  const message = err.isOperational
    ? err.message
    : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

  return res.status(err.statusCode).json({
    success: false,
    error: {
      message,
      statusCode: err.statusCode,
    },
  });
};

/**
 * async 함수를 위한 에러 래퍼
 * try-catch 없이 async 에러를 자동으로 next()로 전달
 *
 * 사용 예:
 * app.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.findAll();  // 에러 시 자동으로 에러 핸들러로
 *   res.json(users);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errors,
  notFoundHandler,
  globalErrorHandler,
  asyncHandler,
};
