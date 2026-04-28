import { IsInt, IsPositive } from 'class-validator';

export class AssignEventDto {
  @IsInt()
  @IsPositive()
  eventId: number;
}
