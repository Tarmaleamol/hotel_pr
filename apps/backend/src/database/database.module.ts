import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { SqliteService } from './sqlite.service';
import { PgService } from './pg.service';
import { DataGateway } from './data.gateway';
import { SchemaInitService } from './schema-init.service';

@Global()
@Module({
  providers: [AppConfigService, SqliteService, PgService, DataGateway, SchemaInitService],
  exports: [AppConfigService, SqliteService, PgService, DataGateway]
})
export class DatabaseModule {}
