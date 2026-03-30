import { ScanResult } from '../entities/qr-scan-log.entity';

export class ScanResultDto {
  result: ScanResult;
  message?: string;
  holderName?: string;
  category?: string;
  eventName?: string;
  checkedAt?: Date;
  seat?: string | null;
}
