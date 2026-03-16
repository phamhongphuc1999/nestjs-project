import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { UserModule } from './controllers/user.controller';
import { PostgresDatabase } from './databases';

@Module({
  imports: [PostgresDatabase, UserModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
