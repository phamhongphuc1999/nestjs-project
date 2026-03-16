import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './controllers/app.controller';
import { UserModule } from './controllers/user.controller';
import { PostgresDatabase } from './databases';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PostgresDatabase,
    UserModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
