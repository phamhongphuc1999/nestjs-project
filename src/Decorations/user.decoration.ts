import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from 'src/entities';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthRequest['user'], context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    if (!req.user) return undefined;
    return data ? req.user[data] : req.user;
  },
);
