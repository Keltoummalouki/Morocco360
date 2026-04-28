import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ScanTicketDto {
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsOptional()
  deviceInfo?: string;
}
