import { Injectable } from '@nestjs/common';
import { DataGateway } from '../../database/data.gateway';

@Injectable()
export class PrintersService {
  constructor(private readonly data: DataGateway) {}

  async list() {
    if (this.data.usingCentral()) {
      return this.data.queryCentral('SELECT * FROM printers ORDER BY name');
    }

    return this.data.readLocal('SELECT * FROM printers ORDER BY name');
  }

  async setRoute(type: 'KOT' | 'BILL', printerId: string) {
    if (this.data.usingCentral()) {
      await this.data.queryCentral(
        `UPDATE printers SET route_type = CASE WHEN id = $1 THEN $2 ELSE route_type END, updated_at = NOW() WHERE id = $1`,
        [printerId, type]
      );
      return { ok: true };
    }

    this.data.writeLocal(
      `UPDATE printers SET route_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [type, printerId],
      { table: 'printers', recordId: printerId, operation: 'UPSERT' }
    );

    return { ok: true };
  }
}
