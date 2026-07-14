import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SettingStatus } from '../../common/enums/status.enum';

export class CreateLanguageDto {
  @IsString()
  @Length(1, 80)
  name: string;

  @IsString()
  @Length(1, 10)
  code: string;

  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  countryIds?: number[];
}

export class UpdateLanguageDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  code?: string;

  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  countryIds?: number[];
}

export class QueryLanguageDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;
}

export class AssignCountriesDto {
  @IsArray()
  @IsInt({ each: true })
  countryIds: number[];
}
