/**
 * 애플리케이션 루트 모듈
 *
 * 【학습 개념: NestJS 모듈 시스템】
 *
 * AppModule은 애플리케이션의 진입점입니다:
 * - 모든 기능 모듈을 imports
 * - 전역 설정 (Config, Database)
 * - 보안 설정 (Rate Limiting)
 *
 * 【모듈 구조】
 *
 * AppModule
 * ├── ConfigModule (환경변수)
 * ├── TypeOrmModule (데이터베이스)
 * ├── ThrottlerModule (Rate Limiting)
 * ├── UsersModule
 * └── AuthModule
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 설정 파일
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

// 기능 모듈
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    /**
     * 환경변수 설정
     *
     * 【학습 포인트】
     * - isGlobal: 모든 모듈에서 ConfigService 사용 가능
     * - load: 커스텀 설정 파일 로드
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig],
    }),

    /**
     * 데이터베이스 연결
     *
     * 【학습 포인트】
     * - forRootAsync: 비동기로 설정 (ConfigService 주입)
     * - autoLoadEntities: 엔티티 자동 로드
     */
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
      }),
      inject: [ConfigService],
    }),

    /**
     * Rate Limiting 설정
     *
     * 【보안 개념: 요청 제한】
     * - DoS 공격 방지
     * - 무차별 대입 공격 방지
     * - ttl: 시간 윈도우 (밀리초)
     * - limit: 최대 요청 수
     */
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1초
        limit: 3,  // 초당 3회
      },
      {
        name: 'medium',
        ttl: 10000, // 10초
        limit: 20,  // 10초당 20회
      },
      {
        name: 'long',
        ttl: 60000, // 1분
        limit: 100, // 분당 100회
      },
    ]),

    // 기능 모듈
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    /**
     * 전역 Rate Limiting 가드
     *
     * 【학습 포인트】
     * APP_GUARD를 사용하면 모든 라우트에 자동 적용
     */
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
