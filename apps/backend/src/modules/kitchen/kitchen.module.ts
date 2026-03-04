import { Module } from '@nestjs/common';
import { KitchenGateway } from './kitchen.gateway';
import { KitchenController } from './kitchen.controller';

@Module({
  providers: [KitchenGateway],
  controllers: [KitchenController],
  exports: [KitchenGateway]
})
export class KitchenModule {}
