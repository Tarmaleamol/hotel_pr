import { Controller, Get } from '@nestjs/common';
import { DataGateway } from '../../database/data.gateway';

@Controller('kitchen')
export class KitchenController {
  constructor(private readonly data: DataGateway) {}

  @Get('queue')
  getQueue() {
    if (this.data.usingCentral()) {
      return this.data.queryCentral(`SELECT * FROM orders WHERE status IN ('KOT_SENT', 'UPDATED') ORDER BY updated_at ASC`);
    }

    return this.data.readLocal(`SELECT * FROM orders WHERE status IN ('KOT_SENT', 'UPDATED') ORDER BY updated_at ASC`);
  }
}
