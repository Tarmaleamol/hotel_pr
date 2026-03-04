import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataGateway } from '../../database/data.gateway';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly data: DataGateway,
    private readonly audit: AuditService
  ) {}

  async generateBill(orderId: string) {
    const order = await this.getOrder(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (!['KOT_SENT', 'UPDATED', 'BILL_GENERATED'].includes(order.status)) {
      throw new BadRequestException('Bill can only be generated after KOT processing');
    }

    if (this.data.usingCentral()) {
      await this.data.queryCentral("UPDATE orders SET status = 'BILL_GENERATED', updated_at = NOW() WHERE id = $1", [orderId]);
    } else {
      this.data.writeLocal(
        "UPDATE orders SET status = 'BILL_GENERATED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [orderId],
        { table: 'orders', recordId: orderId, operation: 'UPSERT' }
      );
    }

    await this.audit.log('BILL_GENERATED', 'orders', orderId, {});
    return this.getOrder(orderId);
  }

  async pay(orderId: string, paymentMode: string) {
    const order = await this.getOrder(orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'BILL_GENERATED') {
      throw new BadRequestException('Order must be billed before payment');
    }

    if (this.data.usingCentral()) {
      await this.data.queryCentral("UPDATE orders SET status = 'PAID', payment_mode = $2, updated_at = NOW() WHERE id = $1", [orderId, paymentMode]);
      await this.data.queryCentral('UPDATE tables SET is_occupied = false, updated_at = NOW() WHERE id = $1', [order.table_id]);
    } else {
      this.data.writeLocal(
        "UPDATE orders SET status = 'PAID', payment_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [paymentMode, orderId],
        { table: 'orders', recordId: orderId, operation: 'UPSERT' }
      );
      this.data.writeLocal(
        'UPDATE tables SET is_occupied = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [order.table_id],
        { table: 'tables', recordId: order.table_id, operation: 'UPSERT' }
      );
    }

    await this.audit.log('PAYMENT_COMPLETED', 'orders', orderId, { paymentMode });
    return { ok: true };
  }

  private async getOrder(orderId: string): Promise<any | null> {
    if (this.data.usingCentral()) {
      return this.data.queryCentralOne('SELECT * FROM orders WHERE id = $1', [orderId]);
    }

    return this.data.readLocalOne('SELECT * FROM orders WHERE id = ?', [orderId]) ?? null;
  }
}
