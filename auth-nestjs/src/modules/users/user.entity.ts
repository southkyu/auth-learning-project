/**
 * User 엔티티
 *
 * 【학습 개념: TypeORM 엔티티】
 *
 * 엔티티는 데이터베이스 테이블과 1:1 매핑되는 클래스입니다:
 * - @Entity(): 클래스를 테이블로 매핑
 * - @Column(): 프로퍼티를 컬럼으로 매핑
 * - @PrimaryGeneratedColumn(): 자동 증가 기본 키
 *
 * 【보안 개념: 비밀번호 저장】
 *
 * 비밀번호는 절대 평문으로 저장하지 않습니다:
 * - bcrypt로 해싱하여 저장
 * - select: false로 기본 조회에서 제외
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ nullable: true })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 비밀번호 설정용 (DB에 저장되지 않음)
  password?: string;

  /**
   * 저장 전 비밀번호 해싱
   *
   * 【학습 포인트】
   * @BeforeInsert, @BeforeUpdate 데코레이터로
   * 엔티티 저장 전 자동으로 실행되는 로직 정의
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      // Salt rounds: 10 (보안과 성능의 균형)
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.password, salt);
    }
  }

  /**
   * 비밀번호 검증
   *
   * 【학습 포인트】
   * bcrypt.compare()는 해시된 비밀번호와 평문을 안전하게 비교
   * 타이밍 공격(Timing Attack) 방지
   */
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  /**
   * 응답용 객체 변환 (비밀번호 제외)
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
