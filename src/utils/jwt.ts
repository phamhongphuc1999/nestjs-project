import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AppConfigs } from 'src/configs/app.config';
import { TOKEN_TYPE } from 'src/types/global';

const configs: { [type in TOKEN_TYPE]: { secret: string; expiresIn: string } } = {
  [TOKEN_TYPE.ACCESS_TOKEN]: {
    secret: AppConfigs.JWT_SECRET,
    expiresIn: AppConfigs.JWT_EXPIRE_TIME,
  },
  [TOKEN_TYPE.EMAIL_VERIFY_TOKEN]: {
    secret: AppConfigs.EMAIL_VERIFY_SECRET,
    expiresIn: AppConfigs.EMAIL_VERIFY_EXPIRE_TIME,
  },
  [TOKEN_TYPE.REFRESH_TOKEN]: {
    secret: AppConfigs.JWT_REFRESH_SECRET,
    expiresIn: AppConfigs.JWT_REFRESH_EXPIRE_TIME,
  },
};

export function generateToken(type: TOKEN_TYPE, data: string | object | Buffer<ArrayBufferLike>) {
  const { secret, expiresIn } = configs[type];
  const signOptions: jwt.SignOptions = { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(data, secret, signOptions);
}

export function verifyToken<T = unknown>(type: TOKEN_TYPE, token: string): T & jwt.JwtPayload {
  try {
    const secret = configs[type].secret;
    const decodedToken = jwt.verify(token, secret) as jwt.JwtPayload;
    return decodedToken as T & jwt.JwtPayload;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}
