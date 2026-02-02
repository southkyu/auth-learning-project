/**
 * NestJS 애플리케이션 진입점
 *
 * 【학습 개념: 앱 부트스트랩】
 *
 * main.ts에서 애플리케이션을 설정하고 시작합니다:
 * - 전역 미들웨어 설정
 * - 보안 설정 (Helmet, CORS)
 * - 유효성 검증 파이프
 * - 예외 필터
 * - 세션 설정
 *
 * 【미들웨어 실행 순서】
 *
 * 요청 → Helmet → CORS → Session → Guard → Pipe → Handler → Filter → 응답
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  /**
   * ========================================
   * 보안 미들웨어
   * ========================================
   */

  /**
   * Helmet: HTTP 보안 헤더 설정
   *
   * 【학습 포인트】
   * 다양한 웹 취약점 방지:
   * - XSS (Cross-Site Scripting)
   * - Clickjacking
   * - MIME 스니핑
   */
  app.use(helmet());

  /**
   * CORS 설정
   *
   * 【학습 개념: Cross-Origin Resource Sharing】
   *
   * 브라우저의 동일 출처 정책(SOP) 우회:
   * - origin: 허용할 도메인
   * - credentials: 쿠키 전송 허용 (세션 인증에 필요)
   */
  app.enableCors({
    origin: nodeEnv === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',')
      : true, // 개발 환경: 모든 origin 허용
    credentials: true,
  });

  /**
   * ========================================
   * Session 설정
   * ========================================
   *
   * 【학습 개념: 세션 저장소】
   *
   * PostgreSQL을 세션 저장소로 사용:
   * - 서버 재시작해도 세션 유지
   * - 다중 서버 환경에서 세션 공유
   */
  const PgSession = connectPgSimple(session);

  app.use(
    session({
      store: new PgSession({
        conString: `postgres://${configService.get('database.username')}:${configService.get('database.password')}@${configService.get('database.host')}:${configService.get('database.port')}/${configService.get('database.database')}`,
        createTableIfMissing: true, // 세션 테이블 자동 생성
      }),
      secret: configService.get<string>('SESSION_SECRET') || 'your-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: nodeEnv === 'production', // HTTPS에서만 쿠키 전송
        httpOnly: true, // JavaScript에서 쿠키 접근 불가
        maxAge: configService.get<number>('SESSION_MAX_AGE') || 86400000, // 24시간
        sameSite: nodeEnv === 'production' ? 'strict' : 'lax', // CSRF 방지
      },
    }),
  );

  /**
   * ========================================
   * 전역 파이프
   * ========================================
   *
   * 【학습 개념: ValidationPipe】
   *
   * DTO의 class-validator 데코레이터를 자동 실행:
   * - whitelist: DTO에 정의되지 않은 속성 제거
   * - forbidNonWhitelisted: 정의되지 않은 속성이 있으면 에러
   * - transform: 요청 데이터를 DTO 클래스로 변환
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  /**
   * ========================================
   * 전역 예외 필터
   * ========================================
   */
  app.useGlobalFilters(new AllExceptionsFilter());

  /**
   * ========================================
   * 서버 시작
   * ========================================
   */
  await app.listen(port);

  logger.log('========================================');
  logger.log(`🚀 서버가 포트 ${port}에서 실행 중입니다!`);
  logger.log('========================================');
  logger.log(`📍 Base URL: http://localhost:${port}`);
  logger.log(`🔧 Environment: ${nodeEnv}`);
  logger.log('');
  logger.log('📚 API 엔드포인트:');
  logger.log('   POST /api/auth/register       - 회원가입');
  logger.log('   POST /api/auth/login          - JWT 로그인');
  logger.log('   POST /api/auth/refresh        - 토큰 갱신');
  logger.log('   GET  /api/auth/me             - 내 정보 (JWT)');
  logger.log('   POST /api/auth/session/login  - Session 로그인');
  logger.log('   POST /api/auth/session/logout - Session 로그아웃');
  logger.log('   GET  /api/auth/session/me     - 내 정보 (Session)');
  logger.log('========================================');
}

bootstrap();
