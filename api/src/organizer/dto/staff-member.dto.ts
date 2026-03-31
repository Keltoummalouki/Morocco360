import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
class StaffUserDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'john_doe' })
  username: string;

  @Expose()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @Expose()
  @ApiProperty({ example: 'John Doe' })
  full_name: string;
}

@Exclude()
export class StaffMemberDto {
  @Expose()
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @Expose()
  @ApiProperty({ enum: ['ORGANIZER', 'STAFF'] })
  staffRole: string;

  @Expose()
  @ApiProperty({ example: '2026-03-15T10:00:00Z' })
  assignedAt: Date;

  @Expose()
  @ApiProperty({ type: StaffUserDto })
  user: StaffUserDto;
}
