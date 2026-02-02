/**
 * JWT 인증 전략
 *
 * 【학습 개념: Passport Strategy】
 *
 * Passport는 인증을 전략(Strategy) 패턴으로 처리합니다:
 * - LocalStrategy: 이메일/비밀번호 인증
 * - JwtStrategy: JWT 토큰 인증
 * - 각 전략은 validate() 메서드로 인증 로직 구현
 *
 * 【JWT 인증 흐름】
 *
 * 1. 클라이언트가 Authorization 헤더에 토큰 전송
 * 2. JwtStrategy가 토큰 추출 및 검증
 * 3. validate()에서 payload로 사용자 조회
 * 4. 사용자 정보를 req.user에 저장
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

// JWT Payload 타입 정의
interface JwtPayload {
  sub: number; // 사용자 ID (subject)
  email: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // 토큰 추출 방법: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // 만료된 토큰 거부
      ignoreExpiration: false,

      // 서명 검증용 비밀 키
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  /**
   * 토큰 검증 후 실행
   *
   * 【학습 포인트】
   * - 이미 서명과 만료 시간은 검증됨
   * - 여기서는 payload의 사용자가 실제 존재하는지 확인
   * - 반환값이 req.user에 저장됨
   */
  async validate(payload: JwtPayload) {
    // Access Token만 허용
    if (payload.type !== 'access') {
      throw new UnauthorizedException('잘못된 토큰 타입입니다');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    // req.user에 저장될 객체
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
