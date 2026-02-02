/**
 * 로그인 DTO
 *
 * 【학습 포인트: 로그인 검증】
 *
 * 로그인 시에는 비밀번호 복잡도 검증이 불필요:
 * - 이미 회원가입 시 검증됨
 * - 로그인은 존재 여부만 확인
 */

import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email: string;

  @IsString()
  @MinLength(1, { message: '비밀번호를 입력해주세요' })
  password: string;
}
