/**
 * Session 인증 가드
 *
 * 【학습 개념: Session 인증】
 *
 * Session 기반 인증 흐름:
 * 1. 로그인 시 세션 생성 → 세션 ID를 쿠키로 전송
 * 2. 클라이언트는 요청마다 쿠키 자동 전송
 * 3. 서버는 세션 ID로 사용자 정보 조회
 *
 * 【JWT vs Session】
 *
 * Session:
 * - 서버에서 상태 관리 (Stateful)
 * - 즉시 무효화 가능 (로그아웃)
 * - 서버 확장 시 세션 동기화 필요
 *
 * JWT:
 * - 클라이언트에서 상태 관리 (Stateless)
 * - 만료 전까지 유효 (즉시 무효화 어려움)
 * - 서버 확장 용이
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

// Express Session 타입 확장
declare module 'express-session' {
  interface SessionData {
    userId: number;
    email: string;
    name?: string;
  }
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // 세션에 사용자 ID가 있는지 확인
    if (!request.session?.userId) {
      throw new UnauthorizedException('로그인이 필요합니다');
    }

    // req.user에 세션 정보 저장 (컨트롤러에서 사용)
    (request as any).user = {
      id: request.session.userId,
      email: request.session.email,
      name: request.session.name,
    };

    return true;
  }
}
