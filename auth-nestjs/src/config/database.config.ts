/**
 * 데이터베이스 설정
 *
 * 【학습 개념: TypeORM 설정】
 *
 * TypeORM은 NestJS에서 공식 지원하는 ORM입니다:
 * - 엔티티(Entity): 데이터베이스 테이블과 매핑되는 클래스
 * - 리포지토리(Repository): 데이터베이스 CRUD 작업을 추상화
 * - 마이그레이션: 스키마 변경 관리
 *
 * 【보안 개념: 환경변수로 설정 분리】
 * - 민감한 정보(비밀번호 등)는 코드에 직접 작성하지 않음
 * - ConfigService를 통해 환경변수 접근
 */

import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_learning',

  // 엔티티 자동 로드
  autoLoadEntities: true,

  // 개발 환경에서만 동기화 (스키마 자동 생성)
  // ⚠️ 운영 환경에서는 반드시 false로 설정!
  synchronize: process.env.NODE_ENV === 'development',

  // 로깅 설정
  logging: process.env.NODE_ENV === 'development',
}));
