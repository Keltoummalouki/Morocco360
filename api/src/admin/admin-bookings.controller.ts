import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminBookingsService } from './admin-bookings.service';
import {
  AdminBookingsQueryDto,
  SetBookingStatusDto,
  SetTicketStatusDto,
} from './dto/admin-booking.dto';

@ApiTags('Admin · Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminBookingsController {
  constructor(private readonly service: AdminBookingsService) {}

  @Get('bookings')
  @ApiOperation({ summary: 'List bookings (paginated, search, filters)' })
  list(@Query() query: AdminBookingsQueryDto) {
    return this.service.list(query);
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Booking detail (user, event, tickets, payment)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch('bookings/:id/status')
  @ApiOperation({ summary: 'Change booking status (cascades to tickets)' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetBookingStatusDto,
  ) {
    return this.service.setStatus(id, dto.status);
  }

  @Get('bookings/:id/tickets')
  @ApiOperation({ summary: 'Tickets for a booking' })
  getTickets(@Param('id', ParseIntPipe) id: number) {
    return this.service.getTickets(id);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Change a single ticket status' })
  setTicketStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetTicketStatusDto,
  ) {
    return this.service.setTicketStatus(id, dto.status);
  }
}
