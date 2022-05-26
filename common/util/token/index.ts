import * as jwt from 'jsonwebtoken';
import { env } from 'process';

interface ITokenClaims {
  userId: string;
}

export interface ITokenData {
  userId: string;
}

const SECRET = env.TOKEN_SECRET;

export function createToken(userId: string): string {
  const data: ITokenClaims = { userId };

  return jwt.sign(data, SECRET, {
    expiresIn: '30d',
  });
}

export function verifyToken(token: string): ITokenData {
  return jwt.verify(token, SECRET) as ITokenData;
}
