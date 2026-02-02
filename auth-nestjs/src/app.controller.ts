/**
 * 앱 컨트롤러
 *
 * 【학습 포인트】
 * 기본 라우트와 헬스 체크 엔드포인트
 */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * 헬스 체크 엔드포인트
   *
   * 【학습 포인트】
   * @SkipThrottle(): Rate Limiting 제외
   * - 모니터링 도구가 자주 호출하므로 제한 제외
   */
  @Get('health')
  @SkipThrottle()
  healthCheck() {
    return {
      success: true,
      message: '서버가 정상 작동 중입니다',
      timestamp: new Date().toISOString(),
    };
  }
}
