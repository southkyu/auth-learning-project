/**
 * JWT 설정
 *
 * 【학습 개념: JWT 구조】
 *
 * JWT는 세 부분으로 구성됩니다:
 * 1. Header: 토큰 타입과 해싱 알고리즘
 * 2. Payload: 실제 데이터 (클레임)
 * 3. Signature: 토큰 검증용 서명
 *
 * 【보안 개념: Access Token vs Refresh Token】
 *
 * Access Token:
 * - 짧은 만료 시간 (15분)
 * - API 요청 시 사용
 * - 탈취 시 피해 최소화
 *
 * Refresh Token:
 * - 긴 만료 시간 (7일)
 * - Access Token 재발급에만 사용
 * - 안전하게 저장 (httpOnly 쿠키)
 */

import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
