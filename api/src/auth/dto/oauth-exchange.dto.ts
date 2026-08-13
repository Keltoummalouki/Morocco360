import { IsString, MaxLength, MinLength } from 'class-validator';

export class OAuthExchangeDto {
  /** Single-use code minted by the social callback (a short-lived JWT). */
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  code: string;

  /** Raw nonce from the browser cookie; proves this is the browser that started. */
  @IsString()
  @MinLength(32)
  @MaxLength(128)
  nonce: string;
}
