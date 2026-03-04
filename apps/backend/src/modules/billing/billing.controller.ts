import { Body, Controller, Param, Patch } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Patch(':orderId/generate')
  generate(@Param('orderId') orderId: string) {
    return this.service.generateBill(orderId);
  }

  @Patch(':orderId/pay')
  pay(@Param('orderId') orderId: string, @Body() body: { payment_mode: string }) {
    return this.service.pay(orderId, body.payment_mode);
  }
}
