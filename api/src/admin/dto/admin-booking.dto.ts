import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OrderStatus } from '../../orders/entities/order.entity';
import { TicketStatus } from '../../orders/entities/ticket.entity';

export class AdminBookingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  eventId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class SetBookingStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class SetTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
