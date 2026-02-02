/**
 * JWT 인증 가드
 *
 * 【학습 개념: NestJS Guard】
 *
 * Guard는 요청이 라우트 핸들러에 도달하기 전에 실행됩니다:
 * - 인증(Authentication): 누구인지 확인
 * - 인가(Authorization): 권한이 있는지 확인
 *
 * 【실행 순서】
 *
 * Middleware → Guard → Interceptor → Pipe → Handler → Interceptor → Filter
 *
 * 【사용 방법】
 *
 * @UseGuards(JwtAuthGuard)
 * @Get('me')
 * getProfile(@CurrentUser() user) { ... }
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * 【학습 포인트】
   * AuthGuard('jwt')는 JwtStrategy를 사용하도록 지정
   * 필요시 canActivate를 오버라이드하여 추가 로직 구현 가능
   */
  canActivate(context: ExecutionContext) {
    // 기본 JWT 검증 실행
    return super.canActivate(context);
  }
}
