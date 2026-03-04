import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataGateway } from '../../database/data.gateway';
import { AppConfigService } from '../../config/app-config.service';
import { SystemMode } from '../../common/enums';

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);
  private timer?: NodeJS.Timeout;
  private readonly syncTables = new Set(['tables', 'orders', 'order_items', 'menu_items', 'inventory', 'recipes', 'printers', 'audit_logs']);

  constructor(
    private readonly data: DataGateway,
    private readonly config: AppConfigService
  ) {}

  onModuleInit() {
    if (this.config.mode !== SystemMode.HYBRID) {
      return;
    }

    this.timer = setInterval(() => {
      this.syncPending().catch((error) => this.logger.error(error));
    }, this.config.syncIntervalMs);
  }

  async syncPending() {
    const pending = this.data.readLocal<any>(
      `SELECT * FROM sync_logs WHERE status = 'PENDING' ORDER BY updated_at ASC LIMIT 100`
    );

    for (const row of pending) {
      if (!this.syncTables.has(row.table_name)) {
        this.markFailed(row.id, 'TABLE_NOT_ALLOWED');
        continue;
      }

      try {
        const record = this.data.readLocalOne<any>(`SELECT * FROM ${row.table_name} WHERE id = ?`, [row.record_id]);
        if (!record) {
          this.markDone(row.id);
          continue;
        }

        await this.upsertCentral(row.table_name, record);
        this.markDone(row.id);
      } catch (error) {
        const nextRetries = Number(row.retries) + 1;
        this.data.writeLocal(
          `UPDATE sync_logs SET status = 'PENDING', retries = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [nextRetries, (error as Error).message, row.id],
          { table: 'sync_logs', recordId: row.id, operation: 'UPSERT' }
        );
      }
    }
  }

  private async upsertCentral(tableName: string, record: Record<string, any>) {
    const columns = Object.keys(record);
    const values = columns.map((column) => record[column]);

    const inserts = columns.map((c) => `"${c}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const updates = columns.filter((c) => c !== 'id').map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ');

    const sql = `INSERT INTO ${tableName} (${inserts}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updates}`;
    await this.data.queryCentral(sql, values);
  }

  private markDone(syncId: string) {
    this.data.writeLocal(
      `UPDATE sync_logs SET status = 'SYNCED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [syncId],
      { table: 'sync_logs', recordId: syncId, operation: 'UPSERT' }
    );
  }

  private markFailed(syncId: string, message: string) {
    this.data.writeLocal(
      `UPDATE sync_logs SET status = 'FAILED', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [message, syncId],
      { table: 'sync_logs', recordId: syncId, operation: 'UPSERT' }
    );
  }
}
