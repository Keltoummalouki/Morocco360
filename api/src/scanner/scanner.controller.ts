import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventAccessGuard } from './guards/event-access.guard';
import { ScannerService } from './scanner.service';
import { ScanTicketDto } from './dto/scan-ticket.dto';
import { ScanResultDto } from './dto/scan-result.dto';

interface JwtUser {
  id: number;
  email: string;
  role: string;
}

@ApiTags('Scanner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZER', 'ADMIN')
@Controller('scanner')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  /** 30 scans/min per user — prevents automated abuse */
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseGuards(EventAccessGuard)
  @Post('scan')
  @ApiOperation({ summary: 'Scan a QR code ticket' })
  @ApiResponse({
    status: 200,
    type: ScanResultDto,
    description: 'Scan result with status',
  })
  @ApiResponse({ status: 429, description: 'Too many requests (rate limited)' })
  @ApiResponse({ status: 403, description: 'Not assigned to this event' })
  scan(
    @Body() dto: ScanTicketDto,
    @Request() req: { user: JwtUser },
  ): Promise<ScanResultDto> {
    return this.scannerService.scanTicket(dto, req.user);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get events assigned to current scanner' })
  @ApiResponse({
    status: 200,
    description: 'List of assigned events with basic stats',
  })
  getEvents(@Request() req: { user: JwtUser }): Promise<unknown[]> {
    return this.scannerService.getAssignedEvents(req.user.id);
  }
}
