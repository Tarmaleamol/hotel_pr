import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { AppConfigService } from '../config/app-config.service';
import { SystemMode } from '../common/enums';
import { SqliteService } from './sqlite.service';
import { PgService } from './pg.service';

@Injectable()
export class DataGateway {
  constructor(
    private readonly config: AppConfigService,
    private readonly sqlite: SqliteService,
    private readonly pg: PgService
  ) {}

  get mode(): SystemMode {
    return this.config.mode;
  }

  private logPendingSync(tableName: string, recordId: string, operation: string) {
    if (this.mode !== SystemMode.HYBRID) {
      return;
    }

    this.sqlite.run(
      `INSERT INTO sync_logs (id, table_name, record_id, operation, status, retries, updated_at)
       VALUES (?, ?, ?, ?, 'PENDING', 0, CURRENT_TIMESTAMP)`,
      [uuid(), tableName, recordId, operation]
    );
  }

  writeLocal(sql: string, params: any[] = [], syncMeta?: { table: string; recordId: string; operation: string }) {
    const result = this.sqlite.run(sql, params);
    if (syncMeta) {
      this.logPendingSync(syncMeta.table, syncMeta.recordId, syncMeta.operation);
    }
    return result;
  }

  readLocal<T>(sql: string, params: any[] = []): T[] {
    return this.sqlite.all<T>(sql, params);
  }

  readLocalOne<T>(sql: string, params: any[] = []): T | undefined {
    return this.sqlite.get<T>(sql, params);
  }

  async queryCentral<T>(sql: string, params: any[] = []): Promise<T[]> {
    return this.pg.query<T>(sql, params);
  }

  async queryCentralOne<T>(sql: string, params: any[] = []): Promise<T | null> {
    return this.pg.one<T>(sql, params);
  }

  usingCentral(): boolean {
    return this.mode === SystemMode.CENTRAL;
  }

  usingLocal(): boolean {
    return this.mode === SystemMode.LOCAL || this.mode === SystemMode.HYBRID;
  }
}
