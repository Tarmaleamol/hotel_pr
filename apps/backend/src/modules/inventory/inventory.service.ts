import { Injectable } from '@nestjs/common';
import { DataGateway } from '../../database/data.gateway';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly data: DataGateway,
    private readonly audit: AuditService
  ) {}

  async list() {
    if (this.data.usingCentral()) {
      return this.data.queryCentral('SELECT * FROM inventory ORDER BY ingredient_name');
    }
    return this.data.readLocal('SELECT * FROM inventory ORDER BY ingredient_name');
  }

  async bulkUpdate(entries: { id: string; quantity: number }[]) {
    for (const entry of entries) {
      if (this.data.usingCentral()) {
        await this.data.queryCentral('UPDATE inventory SET quantity = $2, updated_at = NOW() WHERE id = $1', [entry.id, entry.quantity]);
      } else {
        this.data.writeLocal(
          'UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [entry.quantity, entry.id],
          { table: 'inventory', recordId: entry.id, operation: 'UPSERT' }
        );
      }
    }

    await this.audit.log('INVENTORY_UPDATED', 'inventory', 'bulk', entries);
    return { ok: true };
  }

  async deductForOrder(orderId: string) {
    if (this.data.usingCentral()) {
      const rows = await this.data.queryCentral<{ ingredient_id: string; qty_used: number }>(
        `SELECT r.ingredient_id, SUM(r.quantity_required * oi.quantity) AS qty_used
         FROM order_items oi
         JOIN recipes r ON oi.menu_item_id = r.menu_item_id
         WHERE oi.order_id = $1
         GROUP BY r.ingredient_id`,
        [orderId]
      );

      for (const row of rows) {
        await this.data.queryCentral(
          'UPDATE inventory SET quantity = quantity - $2, updated_at = NOW() WHERE id = $1',
          [row.ingredient_id, Number(row.qty_used)]
        );
      }
      return;
    }

    const rows = this.data.readLocal<{ ingredient_id: string; qty_used: number }>(
      `SELECT r.ingredient_id, SUM(r.quantity_required * oi.quantity) AS qty_used
       FROM order_items oi
       JOIN recipes r ON oi.menu_item_id = r.menu_item_id
       WHERE oi.order_id = ?
       GROUP BY r.ingredient_id`,
      [orderId]
    );

    for (const row of rows) {
      this.data.writeLocal(
        'UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [Number(row.qty_used), row.ingredient_id],
        { table: 'inventory', recordId: row.ingredient_id, operation: 'UPSERT' }
      );
    }
  }
}
