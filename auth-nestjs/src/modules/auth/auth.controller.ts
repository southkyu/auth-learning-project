/**
 * Auth 컨트롤러
 *
 * 【학습 개념: NestJS 컨트롤러】
 *
 * 컨트롤러는 HTTP 요청을 처리합니다:
 * - @Controller(): 라우트 접두사 설정
 * - @Get(), @Post(): HTTP 메서드 데코레이터
 * - @Body(), @Param(): 요청 데이터 추출
 * - @UseGuards(): 인증/인가 가드 적용
 *
 * 【API 엔드포인트 목록】
 *
 * POST /api/auth/register      - 회원가입
 * POST /api/auth/login         - JWT 로그인
 * POST /api/auth/refresh       - 토큰 갱신
 * GET  /api/auth/me            - 내 정보 (JWT)
 * POST /api/auth/session/login - Session 로그인
 * POST /api/auth/session/logout- Session 로그아웃
 * GET  /api/auth/session/me    - 내 정보 (Session)
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, TokenResponse } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// 현재 사용자 타입
interface AuthUser {
  id: number;
  email: string;
  name?: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 회원가입
   *
   * 【학습 포인트: ValidationPipe】
   * main.ts에서 전역 ValidationPipe 설정으로
   * RegisterDto의 검증 데코레이터가 자동 실행됨
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);

    return {
      success: true,
      message: '회원가입이 완료되었습니다',
      data: result,
    };
  }

  /**
   * JWT 로그인
   *
   * 【학습 포인트: Guard 실행 순서】
   * 1. LocalAuthGuard 실행 → LocalStrategy.validate()
   * 2. 검증 성공 시 req.user에 사용자 정보 저장
   * 3. 컨트롤러 메서드 실행
   */
  @Post('login')
  @HttpCode(HttpStatus.OK) // POST지만 200 반환
  @UseGuards(LocalAuthGuard)
  login(@Req() req: Request) {
    const tokens = this.authService.login(req.user as AuthUser);

    return {
      success: true,
      message: '로그인 성공',
      data: {
        user: req.user,
        ...tokens,
      },
    };
  }

  /**
   * 토큰 갱신
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
    );

    return {
      success: true,
      message: '토큰이 갱신되었습니다',
      data: tokens,
    };
  }

  /**
   * 내 정보 조회 (JWT 인증)
   *
   * 【학습 포인트: @CurrentUser 데코레이터】
   * JwtAuthGuard가 req.user에 저장한 정보를
   * 커스텀 데코레이터로 편리하게 추출
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthUser) {
    const fullUser = await this.usersService.findById(user.id);

    return {
      success: true,
      data: fullUser?.toJSON(),
    };
  }

  // ========================================
  // Session 기반 인증 엔드포인트
  // ========================================

  /**
   * Session 로그인
   *
   * 【학습 포인트: 세션 저장】
   * req.session에 사용자 정보 저장
   * → 세션 ID가 쿠키로 클라이언트에 전송됨
   */
  @Post('session/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  sessionLogin(@Req() req: Request) {
    const user = req.user as AuthUser;

    // 세션에 사용자 정보 저장
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.name = user.name;

    return {
      success: true,
      message: '세션 로그인 성공',
      data: { user },
    };
  }

  /**
   * Session 로그아웃
   *
   * 【학습 포인트: 세션 삭제】
   * req.session.destroy()로 서버의 세션 데이터 삭제
   * → 클라이언트의 쿠키는 무효화됨
   */
  @Post('session/logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  sessionLogout(@Req() req: Request) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
        }
        resolve({
          success: true,
          message: '로그아웃 되었습니다',
        });
      });
    });
  }

  /**
   * 내 정보 조회 (Session 인증)
   */
  @Get('session/me')
  @UseGuards(SessionAuthGuard)
  async getSessionProfile(@CurrentUser() user: AuthUser) {
    const fullUser = await this.usersService.findById(user.id);

    return {
      success: true,
      data: fullUser?.toJSON(),
    };
  }
}
