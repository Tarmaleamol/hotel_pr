import { Body, Controller, Get, Patch } from '@nestjs/common';
import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(private readonly service: TablesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Patch('availability')
  setAvailability(@Body() body: { table_id: string; is_occupied: boolean }) {
    return this.service.setAvailability(body.table_id, body.is_occupied);
  }
}
