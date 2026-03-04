import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Database = require('better-sqlite3');
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class SqliteService implements OnModuleDestroy {
  private readonly db: Database.Database;

  constructor(config: AppConfigService) {
    this.db = new Database(config.sqlitePath);
    this.db.pragma('journal_mode = WAL');
  }

  run(sql: string, params: any[] = []): Database.RunResult {
    return this.db.prepare(sql).run(...params);
  }

  get<T>(sql: string, params: any[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  all<T>(sql: string, params: any[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  onModuleDestroy() {
    this.db.close();
  }
}
