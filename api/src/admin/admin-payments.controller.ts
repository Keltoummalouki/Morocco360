import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminPaymentsService } from './admin-payments.service';
import {
  AdminPaymentsQueryDto,
  SetPaymentStatusDto,
} from './dto/admin-payment.dto';

@ApiTags('Admin · Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly service: AdminPaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List payments (paginated, search, filters)' })
  list(@Query() query: AdminPaymentsQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Payment detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change payment status (syncs the order)' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetPaymentStatusDto,
  ) {
    return this.service.setStatus(id, dto.status);
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Invoice data (JSON)' })
  getInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.service.getInvoice(id);
  }

  @Get(':id/invoice/pdf')
  @ApiOperation({ summary: 'Invoice as a printable PDF' })
  async getInvoicePdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    // Non-passthrough @Res: we own the response, Nest must not also send it.
    const { buffer, filename } = await this.service.getInvoicePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.end(buffer);
  }
}
