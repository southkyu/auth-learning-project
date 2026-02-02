/**
 * 현재 사용자 데코레이터
 *
 * 【학습 개념: 커스텀 데코레이터】
 *
 * NestJS에서 파라미터 데코레이터를 만들어
 * req.user를 편리하게 추출할 수 있습니다.
 *
 * 【사용 방법】
 *
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: AuthUser) {
 *   return user;
 * }
 *
 * // 특정 필드만 추출
 * getProfile(@CurrentUser('id') userId: number) {
 *   return userId;
 * }
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 특정 필드만 요청한 경우
    if (data) {
      return user?.[data];
    }

    return user;
  },
);
