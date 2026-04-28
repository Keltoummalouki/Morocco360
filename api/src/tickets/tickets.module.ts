import { Module } from '@nestjs/common';
import { QRCodeService } from './qr-code.service';

@Module({
  providers: [QRCodeService],
  exports: [QRCodeService],
})
export class TicketsModule {}
