import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AddItemsDto, CreateOrderDto } from './order.types';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get('active')
  getActiveOrders() {
    return this.service.getActiveOrders();
  }

  @Post()
  createOrder(@Body() body: CreateOrderDto) {
    return this.service.createOrder(body);
  }

  @Patch(':orderId/items')
  addItems(@Param('orderId') orderId: string, @Body() body: AddItemsDto) {
    return this.service.addItems(orderId, body.items);
  }

  @Patch(':orderId/send-kot')
  sendKot(@Param('orderId') orderId: string) {
    return this.service.sendKot(orderId);
  }
}
