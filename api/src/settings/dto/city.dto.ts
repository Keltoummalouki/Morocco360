import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SettingStatus } from '../../common/enums/status.enum';

export class CreateCityDto {
  @IsString()
  @Length(1, 120)
  name: string;

  @IsOptional()
  @IsInt()
  countryId?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;
}

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @IsOptional()
  @IsInt()
  countryId?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;
}

export class QueryCityDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryId?: number;
}
