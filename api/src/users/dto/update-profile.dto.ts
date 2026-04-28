import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  full_name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  @Matches(/^[+\d\s\-().]*$/, { message: 'Invalid phone number format' })
  phone_number?: string;
}
