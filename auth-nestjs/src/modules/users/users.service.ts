/**
 * Users 서비스
 *
 * 【학습 개념: NestJS 서비스】
 *
 * 서비스는 비즈니스 로직을 담당합니다:
 * - 컨트롤러는 HTTP 요청/응답만 처리
 * - 서비스는 실제 데이터 처리 로직
 * - 재사용 가능하고 테스트하기 쉬움
 *
 * 【학습 개념: Repository 패턴】
 *
 * TypeORM의 Repository를 주입받아 사용:
 * - find(), findOne(): 조회
 * - save(): 생성/수정
 * - delete(): 삭제
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * 이메일로 사용자 조회
   *
   * 【보안 포인트】
   * 비밀번호 해시가 필요한 경우에만 select로 명시적 요청
   */
  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<User | null> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (includePassword) {
      queryBuilder.addSelect('user.passwordHash');
    }

    return queryBuilder.getOne();
  }

  /**
   * ID로 사용자 조회
   */
  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * 새 사용자 생성
   *
   * 【학습 포인트】
   * Entity의 @BeforeInsert 훅이 자동으로 비밀번호 해싱
   */
  async create(
    email: string,
    password: string,
    name?: string,
  ): Promise<User> {
    const user = this.usersRepository.create({
      email,
      password, // Entity 훅에서 해싱됨
      name,
    });

    return this.usersRepository.save(user);
  }

  /**
   * 이메일 중복 확인
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.usersRepository.count({ where: { email } });
    return count > 0;
  }
}
