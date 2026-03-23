import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './controllers/app.controller';
import { AuthModule } from './controllers/auth.controller';
import { UserModule } from './controllers/user.controller';
import { PostgresDatabase } from './databases';
import { EventsModule } from './events/events.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { WinstonService } from './services/logging';

@Module({
  imports: [
    WinstonService,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(),
    EventsModule,
    PostgresDatabase,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); // all routes
  }
}
