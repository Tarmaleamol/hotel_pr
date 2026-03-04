import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DataGateway } from '../../database/data.gateway';
import { OrderStatus } from '../../common/enums';
import { KitchenGateway } from '../kitchen/kitchen.gateway';
import { AuditService } from '../audit/audit.service';
import { OrderItemInput, CreateOrderDto } from './order.types';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly data: DataGateway,
    private readonly kitchen: KitchenGateway,
    private readonly audit: AuditService,
    private readonly inventory: InventoryService
  ) {}

  async getActiveOrders() {
    if (this.data.usingCentral()) {
      return this.data.queryCentral(
        `SELECT * FROM orders WHERE status != 'PAID' ORDER BY updated_at DESC`
      );
    }

    return this.data.readLocal(`SELECT * FROM orders WHERE status != 'PAID' ORDER BY updated_at DESC`);
  }

  async createOrder(dto: CreateOrderDto) {
    const orderId = uuid();
    const nowStatus = OrderStatus.CREATED;

    if (this.data.usingCentral()) {
      await this.data.queryCentral(
        `INSERT INTO orders (id, table_id, status, subtotal, tax, total, updated_at)
         VALUES ($1, $2, $3, 0, 0, 0, NOW())`,
        [orderId, dto.table_id, nowStatus]
      );

      for (const item of dto.items) {
        await this.insertCentralOrderItem(orderId, item);
      }

      await this.recomputeCentralTotals(orderId);
      await this.data.queryCentral(`UPDATE tables SET is_occupied = true, updated_at = NOW() WHERE id = $1`, [dto.table_id]);
    } else {
      this.data.writeLocal(
        `INSERT INTO orders (id, table_id, status, subtotal, tax, total, updated_at)
         VALUES (?, ?, ?, 0, 0, 0, CURRENT_TIMESTAMP)`,
        [orderId, dto.table_id, nowStatus],
        { table: 'orders', recordId: orderId, operation: 'UPSERT' }
      );

      for (const item of dto.items) {
        this.insertLocalOrderItem(orderId, item);
      }

      this.recomputeLocalTotals(orderId);
      this.data.writeLocal(
        `UPDATE tables SET is_occupied = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [dto.table_id],
        { table: 'tables', recordId: dto.table_id, operation: 'UPSERT' }
      );
    }

    await this.audit.log('ORDER_CREATED', 'orders', orderId, dto);
    const order = await this.getOrderById(orderId);
    this.kitchen.emitOrderUpdated(order);
    return order;
  }

  async addItems(orderId: string, items: OrderItemInput[]) {
    const order = await this.getOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (this.data.usingCentral()) {
      for (const item of items) {
        await this.insertCentralOrderItem(orderId, item);
      }
      await this.data.queryCentral(`UPDATE orders SET status = 'UPDATED', updated_at = NOW() WHERE id = $1`, [orderId]);
      await this.recomputeCentralTotals(orderId);
    } else {
      for (const item of items) {
        this.insertLocalOrderItem(orderId, item);
      }
      this.data.writeLocal(
        `UPDATE orders SET status = 'UPDATED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [orderId],
        { table: 'orders', recordId: orderId, operation: 'UPSERT' }
      );
      this.recomputeLocalTotals(orderId);
    }

    await this.audit.log('ORDER_ITEMS_UPDATED', 'orders', orderId, { items });
    const updated = await this.getOrderById(orderId);
    this.kitchen.emitOrderUpdated(updated);
    return updated;
  }

  async sendKot(orderId: string) {
    const order = await this.getOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (this.data.usingCentral()) {
      await this.data.queryCentral(`UPDATE orders SET status = 'KOT_SENT', updated_at = NOW() WHERE id = $1`, [orderId]);
    } else {
      this.data.writeLocal(
        `UPDATE orders SET status = 'KOT_SENT', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [orderId],
        { table: 'orders', recordId: orderId, operation: 'UPSERT' }
      );
    }

    await this.inventory.deductForOrder(orderId);
    await this.audit.log('KOT_SENT', 'orders', orderId, {});

    const updated = await this.getOrderById(orderId);
    this.kitchen.emitKotSent(updated);
    return updated;
  }

  async getOrderById(orderId: string) {
    if (this.data.usingCentral()) {
      return this.data.queryCentralOne(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    }

    return this.data.readLocalOne(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  }

  private async insertCentralOrderItem(orderId: string, item: OrderItemInput) {
    const menu = await this.data.queryCentralOne<{ price: number }>(`SELECT price FROM menu_items WHERE id = $1`, [item.menu_item_id]);
    const price = menu?.price ?? 0;
    await this.data.queryCentral(
      `INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uuid(), orderId, item.menu_item_id, item.quantity, price, item.notes ?? null]
    );
  }

  private insertLocalOrderItem(orderId: string, item: OrderItemInput) {
    const menu = this.data.readLocalOne<{ price: number }>(`SELECT price FROM menu_items WHERE id = ?`, [item.menu_item_id]);
    const price = menu?.price ?? 0;
    const itemId = uuid();
    this.data.writeLocal(
      `INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [itemId, orderId, item.menu_item_id, item.quantity, price, item.notes ?? null],
      { table: 'order_items', recordId: itemId, operation: 'UPSERT' }
    );
  }

  private async recomputeCentralTotals(orderId: string) {
    await this.data.queryCentral(
      `UPDATE orders
       SET subtotal = COALESCE((SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = $1), 0),
           tax = COALESCE((SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = $1), 0) * 0.05,
           total = COALESCE((SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = $1), 0) * 1.05,
           updated_at = NOW()
       WHERE id = $1`,
      [orderId]
    );
  }

  private recomputeLocalTotals(orderId: string) {
    this.data.writeLocal(
      `UPDATE orders
       SET subtotal = COALESCE((SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = ?), 0),
           tax = COALESCE((SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = ?), 0) * 0.05,
           total = COALESCE((SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = ?), 0) * 1.05,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [orderId, orderId, orderId, orderId],
      { table: 'orders', recordId: orderId, operation: 'UPSERT' }
    );
  }
}
