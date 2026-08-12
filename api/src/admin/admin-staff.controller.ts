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

@ApiTags('Admin · Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/staff')
export class AdminStaffController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List staff (paginated, search, filter)' })
  list(@Query() query: AdminUsersQueryDto) {
    return this.service.list(query, RoleName.STAFF);
  }

  @Post()
  @ApiOperation({ summary: 'Create a staff member' })
  create(@Body() dto: CreateAdminUserDto) {
    return this.service.create(dto, RoleName.STAFF);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one staff member' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff member' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Suspend / activate a staff member' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserStatusDto,
  ) {
    return this.service.setStatus(id, dto.status);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Events a staff member is assigned to' })
  getEvents(@Param('id', ParseIntPipe) id: number) {
    return this.service.getStaffEvents(id);
  }
}
