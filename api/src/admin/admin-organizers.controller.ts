import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../users/entities/role.entity';
import { AdminUsersService } from './admin-users.service';
import {
  AdminUsersQueryDto,
  CreateAdminUserDto,
  SetUserStatusDto,
  UpdateAdminUserDto,
} from './dto/admin-user.dto';

@ApiTags('Admin · Organizers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/organizers')
export class AdminOrganizersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List organizers (paginated, search, filter)' })
  list(@Query() query: AdminUsersQueryDto) {
    return this.service.list(query, RoleName.ORGANIZER);
  }

  @Post()
  @ApiOperation({ summary: 'Create an organizer' })
  create(@Body() dto: CreateAdminUserDto) {
    return this.service.create(dto, RoleName.ORGANIZER);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one organizer' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an organizer' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Suspend / activate an organizer' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserStatusDto,
  ) {
    return this.service.setStatus(id, dto.status);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Events created by or assigned to an organizer' })
  getEvents(@Param('id', ParseIntPipe) id: number) {
    return this.service.getOrganizerEvents(id);
  }
}
