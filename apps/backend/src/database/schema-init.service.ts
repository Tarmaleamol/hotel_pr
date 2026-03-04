import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import { readFileSync } from 'fs';
import { DataGateway } from './data.gateway';
import { SqliteService } from './sqlite.service';

@Injectable()
export class SchemaInitService implements OnModuleInit {
  private readonly logger = new Logger(SchemaInitService.name);

  constructor(
    private readonly data: DataGateway,
    private readonly sqlite: SqliteService
  ) {}

  onModuleInit() {
    if (this.data.usingCentral()) {
      return;
    }

    const sqlPath = join(process.cwd(), 'sql', 'sqlite_schema.sql');
    const content = readFileSync(sqlPath, 'utf8');
    const statements = content
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      this.sqlite.run(statement);
    }

    this.logger.log('SQLite schema initialized');
  }
}
