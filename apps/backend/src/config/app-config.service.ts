import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemMode } from '../common/enums';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get mode(): SystemMode {
    return (this.config.get<string>('SYSTEM_MODE') as SystemMode) || SystemMode.LOCAL;
  }

  get sqlitePath(): string {
    return this.config.get<string>('SQLITE_PATH') || './pos.db';
  }

  get pgConnectionString(): string {
    return this.config.get<string>('PG_CONNECTION_STRING') || 'postgres://postgres:postgres@localhost:5432/pos';
  }

  get syncIntervalMs(): number {
    return Number(this.config.get<string>('SYNC_INTERVAL_MS') || 10000);
  }
}
