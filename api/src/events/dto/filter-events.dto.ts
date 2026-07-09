import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EventCategory } from '../entities/event.entity';

export class FilterEventsDto {
  /** Full-text search across title, description, city, location_name */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  /** ISO date — events starting on or after this date */
  @IsOptional()
  @IsDateString()
  date_from?: string;

  /** ISO date — events starting on or before this date */
  @IsOptional()
  @IsDateString()
  date_to?: string;

  /** Minimum price of cheapest ticket category */
  @IsOptional()
  @IsNumberString()
  price_min?: string;

  /** Maximum price of cheapest ticket category */
  @IsOptional()
  @IsNumberString()
  price_max?: string;

  @IsOptional()
  @IsIn(['date', 'price', 'title'])
  sort?: 'date' | 'price' | 'title';

  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  order?: string;
}
