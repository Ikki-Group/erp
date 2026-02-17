import type { Secret, SignOptions } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'

import { env } from '@server/config/env'

/**
 * JWT token payload interface
 */
export interface TokenPayload {
  userId: string
  username: string
  email: string
}

/**
 * Generate JWT token
 * @param payload - Token payload containing user information
 * @returns Signed JWT token string
 */
export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: env.APP_NAME,
  }

  return jwt.sign(payload, env.JWT_SECRET as Secret, options)
}

/**
 * Verify and decode JWT token
 * @param token - JWT token string to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET as Secret, {
      issuer: env.APP_NAME,
    }) as TokenPayload

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    }
    throw error
  }
}
