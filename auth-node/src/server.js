/**
 * 서버 진입점
 *
 * 【학습 개념: 앱과 서버 분리】
 *
 * 왜 app.js와 server.js를 분리할까?
 *
 * 1. 테스트 용이성
 *    - app.js만 import해서 테스트 가능
 *    - 서버를 실제로 실행하지 않고 테스트
 *
 * 2. 관심사 분리
 *    - app.js: Express 설정, 미들웨어, 라우트
 *    - server.js: 서버 시작, 환경 설정, 프로세스 관리
 *
 * 【학습 개념: 환경변수 로딩】
 *
 * dotenv.config()는 가장 먼저 실행해야 합니다:
 * - .env 파일의 내용을 process.env에 로드
 * - 다른 모듈이 환경변수를 사용하기 전에 로드 필요
 */

// 환경변수 로드 (가장 먼저!)
require('dotenv').config();

const { app, initializeSessionMiddleware, initializeRoutes } = require('./app');
const { initializeDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;

/**
 * 서버 시작 함수
 *
 * 순서가 중요합니다:
 * 1. 환경변수 로드 (이미 완료)
 * 2. 데이터베이스 연결
 * 3. Session 미들웨어 초기화 (DB 연결 필요)
 * 4. 라우트 초기화
 * 5. 서버 시작
 */
const startServer = async () => {
  try {
    console.log('🚀 서버 시작 중...\n');

    // 1. 데이터베이스 연결 및 테이블 생성
    console.log('📦 데이터베이스 연결 중...');
    const dbConnected = await initializeDatabase();

    if (!dbConnected) {
      console.error('❌ 데이터베이스 연결 실패. 서버를 시작할 수 없습니다.');
      console.log('\n💡 해결 방법:');
      console.log('   1. PostgreSQL이 실행 중인지 확인하세요');
      console.log('   2. .env 파일의 DB 설정을 확인하세요');
      console.log('   3. 데이터베이스가 생성되어 있는지 확인하세요');
      console.log('      → psql -U postgres -c "CREATE DATABASE auth_learning;"');
      process.exit(1);
    }

    // 2. Session 미들웨어 초기화 (DB 연결 후)
    initializeSessionMiddleware();

    // 3. 라우트 초기화
    initializeRoutes();

    // 4. 서버 시작
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log(`🎉 서버가 포트 ${PORT}에서 실행 중입니다!`);
      console.log('========================================');
      console.log(`📍 Base URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('\n📚 API 엔드포인트:');
      console.log('   POST /api/auth/register      - 회원가입');
      console.log('   POST /api/auth/login         - JWT 로그인');
      console.log('   POST /api/auth/refresh       - 토큰 갱신');
      console.log('   GET  /api/auth/me            - 내 정보 (JWT)');
      console.log('   POST /api/auth/session/login - Session 로그인');
      console.log('   POST /api/auth/session/logout- Session 로그아웃');
      console.log('   GET  /api/auth/session/me    - 내 정보 (Session)');
      console.log('========================================\n');
    });

  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

/**
 * 프로세스 종료 처리
 *
 * 【학습 개념: Graceful Shutdown】
 * 서버 종료 시 진행 중인 요청을 처리하고 리소스 정리
 */
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM 신호 수신. 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT 신호 수신. 서버를 종료합니다...');
  process.exit(0);
});

// 처리되지 않은 예외 처리
process.on('uncaughtException', (error) => {
  console.error('❌ 처리되지 않은 예외:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason);
  process.exit(1);
});

// 서버 시작
startServer();
