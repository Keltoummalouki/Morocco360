import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminReviewsService } from './admin-reviews.service';
import {
  AdminReviewsQueryDto,
  SetReviewStatusDto,
} from './dto/admin-review.dto';

@ApiTags('Admin · Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly service: AdminReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List reviews (paginated, search, filters)' })
  list(@Query() query: AdminReviewsQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Review detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve / unapprove a review' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetReviewStatusDto,
    @Req() req: Request & { user: { id: number } },
  ) {
    return this.service.setStatus(id, dto.status, req.user.id);
  }
}
