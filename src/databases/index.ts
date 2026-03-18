import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import path from 'path';
import { AppConfigs } from 'src/configs/app.config';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as entities from '../entities';

const postgresConfig: TypeOrmModuleOptions & DataSourceOptions = {
  type: 'postgres',
  host: AppConfigs.DATABASE.HOST,
  port: AppConfigs.DATABASE.PORT,
  username: AppConfigs.DATABASE.USERNAME,
  password: AppConfigs.DATABASE.PASSWORD,
  database: AppConfigs.DATABASE.DATABASE,
  synchronize: true,

  entities: Object.values(entities),
  // migrations: [path.join(__dirname, '/../migrations/*.{ts}')],
  migrations: [path.join(__dirname, '/../migrations/*.{sql}')],
};

const PostgresDataSource = new DataSource(postgresConfig);

const PostgresDatabase = TypeOrmModule.forRoot(postgresConfig);

export { PostgresDatabase, PostgresDataSource };
