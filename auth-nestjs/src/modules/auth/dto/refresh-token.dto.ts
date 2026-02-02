/**
 * 토큰 갱신 DTO
 */

import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'Refresh 토큰을 입력해주세요' })
  refreshToken: string;
}
