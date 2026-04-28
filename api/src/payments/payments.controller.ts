import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  RawBody,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** Create a Stripe Checkout Session — requires authentication */
  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  createCheckoutSession(
    @Body() dto: CreateCheckoutDto,
    @Req() req: Request & { user: { id: number } },
  ) {
    return this.paymentsService.createCheckoutSession(dto, req.user.id);
  }

  /** Billets de l'utilisateur connecté (passés et futurs) */
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  getMyOrders(@Req() req: Request & { user: { id: number } }) {
    return this.paymentsService.getMyOrders(req.user.id);
  }

  /** Get order info + QR codes for the success page */
  @Get('success-info')
  getSuccessInfo(
    @Query('session_id') sessionId?: string,
    @Query('order_id') orderId?: string,
  ) {
    return this.paymentsService.getSuccessInfo({ sessionId, orderId });
  }

  /** Download all tickets for an order as a single PDF */
  @Get('order/:id/pdf')
  async downloadOrderPdf(
    @Param('id', ParseIntPipe) orderId: number,
    @Res() res: Response,
  ) {
    const pdf = await this.paymentsService.getOrderPdf(orderId);
    if (!pdf)
      throw new NotFoundException('Billets introuvables pour cette commande');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="billets-commande-${orderId}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  /** Stripe Webhook — called by Stripe servers, no auth guard */
  @Post('webhook')
  @HttpCode(200)
  handleWebhook(
    @RawBody() payload: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }
}
