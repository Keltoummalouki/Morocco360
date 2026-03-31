import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { EventStaffRole } from '../../events/entities/event-staff.entity';

export class AssignStaffDto {
  @IsInt()
  @IsPositive()
  userId: number;

  @IsEnum(EventStaffRole)
  staffRole: EventStaffRole;
}
