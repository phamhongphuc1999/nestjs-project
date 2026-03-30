/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { WinstonModule } from 'nest-winston';
import winston from 'winston';

const WinstonService = WinstonModule.forRoot({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(
      ({ timestamp, level, message, stack }) => `${timestamp} [${level}] ${stack ?? message}`,
    ),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' }),
  ],
});

export { WinstonService };
