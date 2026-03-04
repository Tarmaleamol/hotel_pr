import { Controller, Get, Head } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      status: 'ok'
    };
  }

  @Get('health')
  check() {
    return {
      status: 'ok'
    };
  }

  @Head('health')
  checkHead() {
    return;
  }
}
