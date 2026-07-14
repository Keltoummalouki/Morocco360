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

@ApiTags('Admin · Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (paginated, search, filter by status/role)' })
  list(@Query() query: AdminUsersQueryDto) {
    // Defaults to normal users unless a role filter is supplied.
    return this.service.list(query, query.role ?? RoleName.USER);
  }

  // Declared before ':id' so the static path wins.
  @Get('search')
  @ApiOperation({ summary: 'Search users for assignment pickers' })
  search(@Query('role') role?: RoleName, @Query('search') search?: string) {
    return this.service.search(role, search);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  create(@Body() dto: CreateAdminUserDto) {
    return this.service.create(dto, dto.role ?? RoleName.USER);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one user' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Suspend / activate a user' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserStatusDto,
  ) {
    return this.service.setStatus(id, dto.status);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: "List a user's bookings/orders" })
  getOrders(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AdminUsersQueryDto,
  ) {
    return this.service.getOrders(id, query);
  }
}
