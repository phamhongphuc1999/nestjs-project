import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRequest } from 'src/entities';
import { UserRepository } from 'src/repository/user.repository';
import { verifySignature } from 'src/utils/jwt';
import { IsNull } from 'typeorm';

@Injectable()
export class TokenSecurityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    const authenticationArray = request?.headers?.authorization?.split?.(' ');
    const token = authenticationArray?.[1];

    if (!token?.length) throw new UnauthorizedException('Token is incorrect');

    const decodedToken = verifySignature(token);
    const id = decodedToken?.sub;
    if (!id || !decodedToken?.exp) throw new UnauthorizedException('Cannot decode token');

    const expiresIn = decodedToken.exp - Math.floor(Date.now() / 1000);

    if (expiresIn <= 0) throw new UnauthorizedException('Token expired');

    const user = await this.userRepository.findOne({
      where: { id: Number(id), deletedAt: IsNull() },
    });

    if (!user) throw new UnauthorizedException('User not found');
    request.user = user;
    return true;
  }
}
