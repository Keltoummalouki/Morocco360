import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBody,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
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
    @Req() req: Request & { user: { sub: number } },
  ) {
    return this.paymentsService.createCheckoutSession(dto, req.user.sub);
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
