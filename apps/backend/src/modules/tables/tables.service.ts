import { Injectable } from '@nestjs/common';
import { DataGateway } from '../../database/data.gateway';

@Injectable()
export class TablesService {
  constructor(private readonly data: DataGateway) {}

  async list() {
    if (this.data.usingCentral()) {
      return this.data.queryCentral('SELECT * FROM tables ORDER BY table_no');
    }
    return this.data.readLocal('SELECT * FROM tables ORDER BY table_no');
  }

  async setAvailability(tableId: string, isOccupied: boolean) {
    if (this.data.usingCentral()) {
      await this.data.queryCentral('UPDATE tables SET is_occupied = $2, updated_at = NOW() WHERE id = $1', [tableId, isOccupied]);
    } else {
      this.data.writeLocal(
        'UPDATE tables SET is_occupied = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [isOccupied ? 1 : 0, tableId],
        { table: 'tables', recordId: tableId, operation: 'UPSERT' }
      );
    }
    return { ok: true };
  }
}
