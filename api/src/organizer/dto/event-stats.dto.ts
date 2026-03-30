import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class CategoryStatsDto {
  @Expose()
  @ApiProperty({ example: 'VIP' })
  name: string;

  @Expose()
  @ApiProperty({ example: 100 })
  total: number;

  @Expose()
  @ApiProperty({ example: 45 })
  checked: number;

  @Expose()
  @ApiProperty({ example: 55 })
  remaining: number;
}

@Exclude()
export class EventStatsDto {
  @Expose()
  @ApiProperty({ example: 500 })
  capacity: number;

  @Expose()
  @ApiProperty({ example: 450 })
  sold: number;

  @Expose()
  @ApiProperty({ example: 247 })
  checkedIn: number;

  @Expose()
  @ApiProperty({ example: 50 })
  remaining: number;

  @Expose()
  @Type(() => CategoryStatsDto)
  @ApiProperty({ type: [CategoryStatsDto] })
  byCategory: CategoryStatsDto[];
}
