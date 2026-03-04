import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DataGateway } from '../../database/data.gateway';

@Injectable()
export class MenuService {
  constructor(private readonly data: DataGateway) {}

  async list() {
    if (this.data.usingCentral()) {
      return this.data.queryCentral('SELECT * FROM menu_items WHERE active = true ORDER BY name');
    }
    return this.data.readLocal('SELECT * FROM menu_items WHERE active = 1 ORDER BY name');
  }

  async create(body: { name: string; price: number; active?: boolean }) {
    const id = uuid();
    const active = body.active ?? true;

    if (this.data.usingCentral()) {
      await this.data.queryCentral(
        'INSERT INTO menu_items (id, name, price, active, updated_at) VALUES ($1, $2, $3, $4, NOW())',
        [id, body.name, body.price, active]
      );
      return { id, ...body, active };
    }

    this.data.writeLocal(
      'INSERT INTO menu_items (id, name, price, active, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, body.name, body.price, active ? 1 : 0],
      { table: 'menu_items', recordId: id, operation: 'UPSERT' }
    );

    return { id, ...body, active };
  }
}
