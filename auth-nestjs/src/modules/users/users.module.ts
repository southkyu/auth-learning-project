/**
 * Users 모듈
 *
 * 【학습 개념: NestJS 모듈】
 *
 * 모듈은 관련 기능을 그룹화합니다:
 * - imports: 다른 모듈 가져오기
 * - providers: 서비스, 리포지토리 등록
 * - exports: 다른 모듈에서 사용 가능하게 공개
 * - controllers: HTTP 요청 처리 컨트롤러
 *
 * 【학습 포인트: 모듈 구조】
 *
 * UsersModule은 AuthModule에서 사용되므로
 * UsersService를 exports로 공개합니다.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [
    // TypeORM에 User 엔티티 등록
    TypeOrmModule.forFeature([User]),
  ],
  providers: [UsersService],
  exports: [UsersService], // AuthModule에서 사용
})
export class UsersModule {}
