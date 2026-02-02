/**
 * Auth 모듈
 *
 * 【학습 개념: 기능 모듈 구성】
 *
 * 인증 관련 모든 구성요소를 하나의 모듈로 그룹화:
 * - imports: 필요한 다른 모듈 (Users, JWT, Passport)
 * - providers: 서비스, 전략, 가드
 * - controllers: HTTP 엔드포인트
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    // 사용자 모듈 (UsersService 사용을 위해)
    UsersModule,

    // Passport 설정
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT 설정
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') || '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
