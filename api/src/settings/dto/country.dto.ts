import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SettingStatus } from '../../common/enums/status.enum';

export class CreateCountryDto {
  @IsString()
  @Length(1, 120)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 3)
  iso_code?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  languageIds?: number[];
}

export class UpdateCountryDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 3)
  iso_code?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  languageIds?: number[];
}

export class QueryCountryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;
}

export class AssignLanguagesDto {
  @IsArray()
  @IsInt({ each: true })
  languageIds: number[];
}
