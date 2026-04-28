import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrganizerService } from './organizer.service';
import { AssignStaffDto } from './dto/assign-staff.dto';
import { Ticket } from '../orders/entities/ticket.entity';
import { AssignedEventDto } from './dto/assigned-event.dto';
import { EventStatsDto } from './dto/event-stats.dto';
import { StaffMemberDto } from './dto/staff-member.dto';

interface JwtUser {
  id: number;
  email: string;
  role: string;
}

@ApiTags('Organizer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZER', 'ADMIN')
@Controller('organizer')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Get('events')
  @ApiOperation({ summary: 'Get all events assigned to current user' })
  @ApiResponse({ status: 200, type: [AssignedEventDto] })
  getEvents(@Request() req: { user: JwtUser }) {
    return this.organizerService.getAssignedEvents(req.user.id);
  }

  @Get('events/:eventId/stats')
  @ApiOperation({ summary: 'Get detailed stats for an event' })
  @ApiResponse({ status: 200, type: EventStatsDto })
  getStats(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Request() req: { user: JwtUser },
  ) {
    return this.organizerService.getEventStats(eventId, req.user.id);
  }

  @Get('users/search')
  @ApiOperation({
    summary: 'Search users by email or username for staff assignment',
  })
  @ApiResponse({ status: 200, description: 'List of matching users (max 10)' })
  searchUsers(
    @Query('email') email?: string,
    @Query('username') username?: string,
  ) {
    return this.organizerService.searchUsers(email, username);
  }

  @Roles('ORGANIZER', 'ADMIN')
  @Post('events/:eventId/staff')
  @ApiOperation({ summary: 'Assign staff to an event (ORGANIZER only)' })
  @ApiResponse({ status: 201, description: 'Staff assigned successfully' })
  assignStaff(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: AssignStaffDto,
    @Request() req: { user: JwtUser },
  ) {
    return this.organizerService.assignStaff(eventId, dto, req.user.id);
  }

  @Roles('ORGANIZER', 'ADMIN')
  @Delete('events/:eventId/staff/:userId')
  @ApiOperation({ summary: 'Remove staff from an event (ORGANIZER only)' })
  @ApiResponse({ status: 200, description: 'Staff removed successfully' })
  removeStaff(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.organizerService.removeStaff(eventId, userId);
  }

  @Get('events/:eventId/staff')
  @ApiOperation({ summary: 'Get all staff assigned to an event' })
  @ApiResponse({ status: 200, type: [StaffMemberDto] })
  getStaff(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.organizerService.getStaff(eventId);
  }

  @Roles('ORGANIZER', 'ADMIN')
  @Get('events/:eventId/attendees/export')
  @ApiOperation({ summary: 'Export attendees as CSV (ORGANIZER only)' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportCSV(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Request() req: { user: JwtUser },
    @Res() res: Response,
  ) {
    const tickets: Ticket[] = await this.organizerService.getAttendeesForExport(
      eventId,
      req.user.id,
    );

    const header = 'holderName,email,category,status,checkedAt,qrCode\n';
    const rows = tickets
      .map((t) => {
        const u = t.order?.user;
        const name = u?.full_name ?? u?.username ?? '';
        const qrMasked = t.qr_code ? `${t.qr_code.substring(0, 8)}****` : '';
        return `"${name}","${u?.email ?? ''}","${t.category?.name ?? ''}","${t.status}","${t.checked_at?.toISOString() ?? ''}","${qrMasked}"`;
      })
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="event-${eventId}-attendees.csv"`,
    );
    res.send(header + rows);
  }
}
