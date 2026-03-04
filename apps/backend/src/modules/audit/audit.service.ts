import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DataGateway } from '../../database/data.gateway';

@Injectable()
export class AuditService {
  constructor(private readonly data: DataGateway) {}

  async log(action: string, entityType: string, entityId: string, payload: unknown) {
    const id = uuid();
    const rawPayload = JSON.stringify(payload ?? {});

    if (this.data.usingCentral()) {
      await this.data.queryCentral(
        `INSERT INTO audit_logs (id, action, entity_type, entity_id, payload, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, NOW())`,
        [id, action, entityType, entityId, rawPayload]
      );
      return;
    }

    this.data.writeLocal(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, payload, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, action, entityType, entityId, rawPayload],
      { table: 'audit_logs', recordId: id, operation: 'UPSERT' }
    );
  }
}
