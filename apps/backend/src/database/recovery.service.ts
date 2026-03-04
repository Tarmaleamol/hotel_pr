import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataGateway } from './data.gateway';
import { KitchenGateway } from '../modules/kitchen/kitchen.gateway';

@Injectable()
export class RecoveryService implements OnModuleInit {
  private readonly logger = new Logger(RecoveryService.name);

  constructor(
    private readonly data: DataGateway,
    private readonly kitchen: KitchenGateway
  ) {}

  async onModuleInit() {
    const activeOrders = this.data.usingCentral()
      ? await this.data.queryCentral(`SELECT * FROM orders WHERE status != 'PAID' ORDER BY updated_at DESC`)
      : this.data.readLocal(`SELECT * FROM orders WHERE status != 'PAID' ORDER BY updated_at DESC`);

    this.logger.log(`Recovered ${activeOrders.length} active orders`);
    this.kitchen.emitOrderUpdated({ recovered: true, orders: activeOrders });
  }
}
