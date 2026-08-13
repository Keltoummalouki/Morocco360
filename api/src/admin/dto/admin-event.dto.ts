import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EventCategory, EventStatus } from '../../events/entities/event.entity';
import { SettingStatus } from '../../common/enums/status.enum';

export class AdminTicketCategoryDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock_allocated: number;

  @IsOptional()
  @IsEnum(SettingStatus)
  status?: SettingStatus;
}

/**
 * Foreign-key ids arrive from `<select>` elements, which hand back strings.
 * `@Type(() => Number)` coerces those before validation so a well-formed id is
 * never rejected for its wrapper type, while `@Min(1)` still rejects the values
 * coercion invents out of junk — `Number('')` and `Number(null)` are both 0.
 */

export class CreateAdminEventDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  date_start: string;

  @IsDateString()
  date_end: string;

  @IsString()
  @MaxLength(255)
  location_name: string;

  /** Legacy free-text city (kept in sync with cityId for the public site). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cityId?: number;

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizerId?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total_stock?: number;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminTicketCategoryDto)
  categories?: AdminTicketCategoryDto[];
}

export class UpdateAdminEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date_start?: string;

  @IsOptional()
  @IsDateString()
  date_end?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cityId?: number;

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizerId?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total_stock?: number;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminTicketCategoryDto)
  categories?: AdminTicketCategoryDto[];
}

export class SetEventStatusDto {
  @IsEnum(EventStatus)
  status: EventStatus;
}

export class AssignOrganizerDto {
  @IsInt()
  organizerId: number;
}

export class AssignEventStaffDto {
  @IsInt()
  userId: number;
}
