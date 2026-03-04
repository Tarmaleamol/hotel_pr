import { Body, Controller, Get, Post } from '@nestjs/common';
import { PrintersService } from './printers.service';

@Controller('printers')
export class PrintersController {
  constructor(private readonly service: PrintersService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post('route')
  setRoute(@Body() body: { type: 'KOT' | 'BILL'; printer_id: string }) {
    return this.service.setRoute(body.type, body.printer_id);
  }
}
