import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
class EventStatsBasicDto {
  @Expose()
  @ApiProperty({ example: 500 })
  totalTickets: number;

  @Expose()
  @ApiProperty({ example: 247 })
  checkedIn: number;

  @Expose()
  @ApiProperty({ example: 203 })
  pending: number;

  @Expose()
  @ApiProperty({ example: 50 })
  cancelled: number;
}

@Exclude()
export class AssignedEventDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'Festival Gnaoua 2026' })
  title: string;

  @Expose()
  @ApiProperty({ example: '2026-06-15T20:00:00Z' })
  date_start: Date;

  @Expose()
  @ApiProperty({ example: 'Place Moulay Hassan' })
  location_name: string;

  @Expose()
  @ApiProperty({ example: 'Essaouira' })
  city: string;

  @Expose()
  @ApiProperty({ example: 'https://example.com/image.jpg', nullable: true })
  image_url: string | null;

  @Expose()
  @ApiProperty({ enum: ['ORGANIZER', 'STAFF'] })
  staffRole: string;

  @Expose()
  @ApiProperty({ type: EventStatsBasicDto })
  stats: EventStatsBasicDto;
}
