import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { EventStatus } from '../../events/entities/event.entity';

export class AdminEventsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cityId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  countryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class SearchUsersDto {
  @IsOptional()
  @IsEnum({
    ADMIN: 'ADMIN',
    ORGANIZER: 'ORGANIZER',
    STAFF: 'STAFF',
    USER: 'USER',
  })
  role?: string;

  @IsOptional()
  search?: string;
}
