import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Base query DTO for every admin list endpoint. Extend it to add
 * entity-specific filters (status, role, countryId, …). The global
 * ValidationPipe runs with `transform: true`, so query strings are coerced
 * to the declared types.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  /** Free-text search term; each service decides which columns it matches. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  /** Whitelisted per endpoint against a `sortable` map — never used raw. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sortBy?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: string;
}
