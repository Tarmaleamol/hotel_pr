import { Body, Controller, Get, Patch } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Patch()
  bulkUpdate(@Body() body: { id: string; quantity: number }[]) {
    return this.service.bulkUpdate(body);
  }
}
