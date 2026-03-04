import { Controller, Post } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Post('run')
  run() {
    return this.service.syncPending();
  }
}
