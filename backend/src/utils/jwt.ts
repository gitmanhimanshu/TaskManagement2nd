import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  userId: number;
  email: string;
  companyId: number;
  isAdmin: boolean;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret: jwt.Secret = config.jwt.accessSecret;
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.accessExpiry as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (userId: number): string => {
  const secret: jwt.Secret = config.jwt.refreshSecret;
  const options: jwt.SignOptions = {
    expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign({ userId, tokenType: 'refresh' }, secret, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret as jwt.Secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: number } => {
  return jwt.verify(token, config.jwt.refreshSecret as jwt.Secret) as { userId: number };
};
