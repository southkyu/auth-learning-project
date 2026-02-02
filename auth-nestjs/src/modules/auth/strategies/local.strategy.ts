/**
 * Local 인증 전략 (이메일/비밀번호)
 *
 * 【학습 개념: Local Strategy】
 *
 * 폼 기반 로그인에 사용되는 전략:
 * - usernameField: 사용자 식별 필드 (기본값: username)
 * - passwordField: 비밀번호 필드 (기본값: password)
 *
 * 【인증 흐름】
 *
 * 1. 클라이언트가 이메일/비밀번호 전송
 * 2. LocalStrategy의 validate() 실행
 * 3. 사용자 조회 및 비밀번호 검증
 * 4. 성공 시 사용자 객체 반환 → req.user에 저장
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      // email 필드를 username으로 사용
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  /**
   * 이메일/비밀번호 검증
   *
   * 【보안 포인트】
   * 에러 메시지에서 이메일/비밀번호 중 무엇이 틀렸는지 구분하지 않음
   * → 공격자에게 힌트를 주지 않기 위함
   */
  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    return user;
  }
}
