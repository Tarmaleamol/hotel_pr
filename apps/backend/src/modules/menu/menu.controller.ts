import { Body, Controller, Get, Post } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu-items')
export class MenuController {
  constructor(private readonly service: MenuService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() body: { name: string; price: number; active?: boolean }) {
    return this.service.create(body);
  }
}
