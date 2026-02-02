/**
 * Auth 서비스
 *
 * 【학습 개념: 인증 서비스의 역할】
 *
 * 인증 관련 비즈니스 로직을 담당:
 * - 사용자 검증 (이메일/비밀번호)
 * - JWT 토큰 생성/검증
 * - 회원가입 처리
 */

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto';

// 토큰 응답 타입
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// JWT Payload 타입
interface JwtPayload {
  sub: number;
  email: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 사용자 검증 (LocalStrategy에서 호출)
   *
   * 【보안 포인트】
   * - 비밀번호 해시 포함 조회 (includePassword: true)
   * - bcrypt.compare()로 안전하게 비교
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email, true);

    if (!user) {
      return null;
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return null;
    }

    // 비밀번호 제외한 사용자 정보 반환
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  /**
   * 회원가입
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // 이메일 중복 확인
    const exists = await this.usersService.existsByEmail(email);

    if (exists) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    // 사용자 생성
    const user = await this.usersService.create(email, password, name);

    // 토큰 발급
    const tokens = this.generateTokens(user.id, user.email);

    return {
      user: user.toJSON(),
      ...tokens,
    };
  }

  /**
   * JWT 로그인 (토큰 발급)
   *
   * 【학습 포인트】
   * LocalAuthGuard를 통과한 후 호출됨
   * → req.user에 이미 검증된 사용자 정보 존재
   */
  login(user: { id: number; email: string; name?: string }): TokenResponse {
    return this.generateTokens(user.id, user.email);
  }

  /**
   * 토큰 갱신
   *
   * 【학습 개념: Refresh Token 사용】
   *
   * Access Token이 만료되었을 때:
   * 1. Refresh Token으로 새 토큰 요청
   * 2. Refresh Token 검증
   * 3. 새 Access Token + Refresh Token 발급
   */
  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    try {
      // Refresh Token 검증
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Refresh Token 타입 확인
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('잘못된 토큰 타입입니다');
      }

      // 사용자 존재 확인
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      }

      // 새 토큰 발급
      return this.generateTokens(user.id, user.email);
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 Refresh Token입니다');
    }
  }

  /**
   * Access Token + Refresh Token 생성
   *
   * 【학습 포인트: JWT Payload 설계】
   *
   * - sub: 표준 클레임, 토큰 주체 (사용자 ID)
   * - email: 사용자 식별 정보
   * - type: 토큰 타입 구분 (access/refresh)
   *
   * ⚠️ 민감한 정보(비밀번호 등)는 절대 포함하지 않음
   */
  private generateTokens(userId: number, email: string): TokenResponse {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'refresh',
    };

    return {
      accessToken: this.jwtService.sign(accessPayload as any, {
        secret: this.configService.get<string>('jwt.secret') || 'default-secret',
        expiresIn: (this.configService.get<string>('jwt.expiresIn') || '15m') as any,
      }),
      refreshToken: this.jwtService.sign(refreshPayload as any, {
        secret: this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret',
        expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') || '7d') as any,
      }),
    };
  }
}
