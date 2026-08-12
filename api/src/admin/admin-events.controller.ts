import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminEventsService } from './admin-events.service';
import { AdminEventsQueryDto } from './dto/admin-events-query.dto';
import {
  AdminTicketCategoryDto,
  AssignEventStaffDto,
  AssignOrganizerDto,
  CreateAdminEventDto,
  SetEventStatusDto,
  UpdateAdminEventDto,
} from './dto/admin-event.dto';

/** Renders a cell value as text; objects would otherwise become `[object Object]`. */
function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint')
    return v.toString();
  if (v instanceof Date) return v.toISOString();
  return JSON.stringify(v) ?? '';
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${cell(v).replace(/"/g, '""')}"`;
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\r\n');
}

@ApiTags('Admin · Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/events')
export class AdminEventsController {
  constructor(private readonly service: AdminEventsService) {}

  @Get()
  @ApiOperation({ summary: 'List events (paginated, search, filters, sort)' })
  list(@Query() query: AdminEventsQueryDto) {
    return this.service.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create an event' })
  create(@Body() dto: CreateAdminEventDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one event with organizer, city, categories' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminEventDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Suspend / activate / change event status' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetEventStatusDto,
  ) {
    return this.service.setStatus(id, dto.status);
  }

  @Patch(':id/organizer')
  @ApiOperation({ summary: 'Assign an organizer to an event' })
  assignOrganizer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignOrganizerDto,
  ) {
    return this.service.assignOrganizer(id, dto.organizerId);
  }

  // ── Staff ──────────────────────────────────────────────────
  @Get(':id/staff')
  @ApiOperation({ summary: 'List staff assigned to an event' })
  getStaff(@Param('id', ParseIntPipe) id: number) {
    return this.service.getStaff(id);
  }

  @Post(':id/staff')
  @ApiOperation({ summary: 'Assign a user (staff/organizer) to an event' })
  addStaff(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEventStaffDto,
  ) {
    return this.service.addStaff(id, dto.userId);
  }

  @Delete(':id/staff/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a user from an event' })
  removeStaff(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.service.removeStaff(id, userId);
  }

  // ── Ticket categories ──────────────────────────────────────
  @Post(':id/ticket-categories')
  @ApiOperation({ summary: 'Add a ticket category to an event' })
  addTicketCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminTicketCategoryDto,
  ) {
    return this.service.addTicketCategory(id, dto);
  }

  @Patch(':id/ticket-categories/:categoryId')
  @ApiOperation({ summary: 'Update a ticket category' })
  updateTicketCategory(
    @Param('id', ParseIntPipe) id: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() dto: AdminTicketCategoryDto,
  ) {
    return this.service.updateTicketCategory(id, categoryId, dto);
  }

  @Delete(':id/ticket-categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a ticket category' })
  removeTicketCategory(
    @Param('id', ParseIntPipe) id: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.service.removeTicketCategory(id, categoryId);
  }

  // ── Bookings & attendees ───────────────────────────────────
  @Get(':id/bookings')
  @ApiOperation({ summary: 'List bookings for an event' })
  getBookings(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AdminEventsQueryDto,
  ) {
    return this.service.getBookings(id, query);
  }

  @Get(':id/attendees/export')
  @ApiOperation({ summary: 'Export attendees (JSON, or CSV with ?format=csv)' })
  async exportAttendees(
    @Param('id', ParseIntPipe) id: number,
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.service.getAttendeeExport(id);
    if (format !== 'csv') return data;

    const csv = toCsv(
      data.attendees.map((a) => ({
        name: a.name,
        email: a.email,
        category: a.category,
        status: a.status,
        seat: a.seat ?? '',
        orderId: a.orderId ?? '',
      })),
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="event-${id}-attendees.csv"`,
    );
    return csv;
  }
}
