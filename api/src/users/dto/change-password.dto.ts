import { IsString, Length, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  current_password: string;

  @IsString()
  @Length(8, 100)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and a number',
  })
  new_password: string;
}
