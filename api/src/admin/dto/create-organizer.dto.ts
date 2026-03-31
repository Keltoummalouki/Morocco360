import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOrganizerDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and a number',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;
}
