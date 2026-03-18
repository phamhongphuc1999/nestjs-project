import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AppConfigs } from 'src/configs/app.config';

export const generateSignature = (data: string | object | Buffer<ArrayBufferLike>) => {
  const secret = AppConfigs.JWT_SECRET as jwt.Secret;
  const signOptions: jwt.SignOptions = {
    expiresIn: AppConfigs.JWT_EXPIRE_TIME as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(data, secret, signOptions);
};

export const verifySignature = (token: string): jwt.JwtPayload => {
  try {
    const decodedToken = jwt.verify(token, AppConfigs.JWT_SECRET) as jwt.JwtPayload;

    return decodedToken;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
};

export function generateEmailVerifyToken(data: string | object | Buffer<ArrayBufferLike>) {
  const secret = AppConfigs.EMAIL_VERIFY_SECRET as jwt.Secret;
  const signOptions: jwt.SignOptions = {
    expiresIn: AppConfigs.EMAIL_VERIFY_EXPIRE_TIME as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(data, secret, signOptions);
}

export function verifyEmailToken<T = unknown>(token: string): T & jwt.JwtPayload {
  try {
    const decodedToken = jwt.verify(token, AppConfigs.EMAIL_VERIFY_SECRET) as jwt.JwtPayload;

    return decodedToken as T & jwt.JwtPayload;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}
