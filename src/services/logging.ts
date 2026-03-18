/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { WinstonModule } from 'nest-winston';
import winston from 'winston';

const WinstonService = WinstonModule.forRoot({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' }),
  ],
});

export { WinstonService };
