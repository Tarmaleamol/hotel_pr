import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TablesModule } from './modules/tables/tables.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MenuModule } from './modules/menu/menu.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PrintersModule } from './modules/printers/printers.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { BillingModule } from './modules/billing/billing.module';
import { SyncModule } from './modules/sync/sync.module';
import { AuditModule } from './modules/audit/audit.module';
import { RecoveryService } from './database/recovery.service';
import { ApiKeyMiddleware } from './common/api-key.middleware';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuditModule,
    TablesModule,
    MenuModule,
    InventoryModule,
    PrintersModule,
    KitchenModule,
    OrdersModule,
    BillingModule,
    SyncModule
  ],
  providers: [RecoveryService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('*');
  }
}
