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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventCategoriesService } from './event-categories.service';
import {
  CreateEventCategoryDto,
  QueryEventCategoryDto,
  UpdateEventCategoryDto,
} from './dto/event-category.dto';

@ApiTags('Admin · Settings · Event Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/settings/event-categories')
export class EventCategoriesController {
  constructor(private readonly service: EventCategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List event categories (paginated, search, filter)',
  })
  list(@Query() query: QueryEventCategoryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one event category' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an event category' })
  create(@Body() dto: CreateEventCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event category' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventCategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a category (only when no active events use it)',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
