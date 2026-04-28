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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateUserDto, UpdateUserStatusDto } from './dto/update-user.dto';
import { AssignEventDto } from './dto/assign-event.dto';
import { RoleName } from '../users/entities/role.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats ──────────────────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Platform statistics for admin dashboard' })
  getStats() {
    return this.adminService.getStats();
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'List users (filter by role)' })
  listUsers(@Query('role') role?: RoleName, @Query('search') search?: string) {
    return this.adminService.listUsers(role, search);
  }

  @Post('users/organizers')
  @ApiOperation({ summary: 'Create a new organizer account' })
  createOrganizer(@Body() dto: CreateOrganizerDto) {
    return this.adminService.createOrganizer(dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user profile fields' })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Suspend or activate a user' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.setStatus(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  @Get('events')
  @ApiOperation({ summary: 'List all events (for assignment dropdown)' })
  listEvents() {
    return this.adminService.listEvents();
  }

  // ── Event assignment ───────────────────────────────────────────────────────
  @Get('users/:id/events')
  @ApiOperation({ summary: 'Get events assigned to an organizer' })
  getOrganizerEvents(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getOrganizerEvents(id);
  }

  @Post('users/:id/events')
  @ApiOperation({ summary: 'Assign event to organizer' })
  assignEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEventDto,
  ) {
    return this.adminService.assignEvent(id, dto.eventId);
  }

  @Delete('users/:id/events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove event assignment from organizer' })
  removeEventAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    return this.adminService.removeEventAssignment(id, eventId);
  }
}
