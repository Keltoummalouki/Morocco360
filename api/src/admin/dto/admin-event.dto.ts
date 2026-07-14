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
  @IsInt()
  cityId?: number;

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
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
  @IsInt()
  cityId?: number;

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
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
