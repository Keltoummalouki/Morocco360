import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UserStatus } from '../../users/entities/user.entity';
import { RoleName } from '../../users/entities/role.entity';

export class AdminUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(RoleName)
  role?: RoleName;
}

export class CreateAdminUserDto {
  @IsString()
  @Length(3, 50)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and a number',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone_number?: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  /** Only honored by the generic /admin/users endpoint; the organizer/staff
   *  endpoints force the role. */
  @IsOptional()
  @IsEnum(RoleName)
  role?: RoleName;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 50)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone_number?: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;
}

export class SetUserStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
