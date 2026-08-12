import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SettingStatus } from '../../common/enums/status.enum';

export class CreateEventCategoryDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;
}

export class UpdateEventCategoryDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;
}

export class QueryEventCategoryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;
}
