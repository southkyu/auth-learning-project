/**
 * 회원가입 DTO (Data Transfer Object)
 *
 * 【학습 개념: DTO와 유효성 검증】
 *
 * DTO는 데이터 전송 객체로, 입력 데이터의 형태를 정의합니다:
 * - class-validator: 데코레이터로 유효성 검증 규칙 정의
 * - class-transformer: 요청 데이터를 클래스 인스턴스로 변환
 *
 * 【보안 개념: 입력 검증의 중요성】
 *
 * 모든 사용자 입력은 악의적일 수 있다고 가정:
 * - SQL Injection 방지
 * - XSS 공격 방지
 * - 데이터 무결성 보장
 */

import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @MaxLength(50, { message: '비밀번호는 최대 50자까지 가능합니다' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      '비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다' })
  @MaxLength(50, { message: '이름은 최대 50자까지 가능합니다' })
  name?: string;
}
