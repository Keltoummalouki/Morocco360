import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  @Length(1, 150)
  email?: string;

  // Length starts at 0 so the user can CLEAR their name. @IsOptional() only
  // skips undefined/null — an empty string would otherwise fail @Length(1, …)
  // and 400 every save made by a user who has no full_name set.
  @IsOptional()
  @IsString()
  @Length(0, 150)
  full_name?: string;

  // Loose gate here; the service does authoritative libphonenumber validation
  // and E.164 normalisation. Empty string clears the number.
  @IsOptional()
  @IsString()
  @Length(0, 25)
  @Matches(/^[+\d\s\-().]*$/, { message: 'Invalid phone number format' })
  phone_number?: string;
}
