/**
 * Local 인증 가드
 *
 * 【학습 포인트】
 *
 * 로그인 엔드포인트에서 사용:
 * - LocalStrategy 실행
 * - 이메일/비밀번호 검증
 * - 성공 시 req.user에 사용자 정보 저장
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
