import { IsInt, IsPositive, Min } from 'class-validator';

export class CreateCheckoutDto {
  @IsInt()
  @IsPositive()
  eventId: number;

  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsInt()
  @Min(1)
  quantity: number;
}
