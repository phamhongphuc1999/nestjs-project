import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = exception instanceof HttpException ? exception.getResponse() : undefined;

    const message =
      exception instanceof HttpException
        ? typeof errorResponse === 'string'
          ? errorResponse
          : ((errorResponse as { message?: string }).message ?? exception.message)
        : ((exception as Error)?.message ?? 'Internal server error');

    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(`${request.method} ${request.originalUrl} ${status} - ${message}`, stack);

    if (!response.headersSent) {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.originalUrl,
      });
    }
  }
}
