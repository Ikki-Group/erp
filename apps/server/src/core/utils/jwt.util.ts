import jwt from "jsonwebtoken"
import { config } from "@/core/config"
import { JWT_CONFIG } from "@/core/shared/constants"
import { UnauthorizedError } from "@/core/errors/http.error"

/**
 * JWT token utilities
 */

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: string
  username: string
  email: string
}

/**
 * Decoded JWT with additional metadata
 */
export interface DecodedJwt extends JwtPayload {
  iat: number
  exp: number
  iss: string
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JwtPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as string,
    issuer: JWT_CONFIG.ISSUER,
    algorithm: "HS256",
  }

  return jwt.sign(payload, config.JWT_SECRET, options)
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): DecodedJwt {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      algorithms: [JWT_CONFIG.ALGORITHM as jwt.Algorithm],
    }) as DecodedJwt

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Token has expired", "TOKEN_EXPIRED")
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Invalid token", "TOKEN_INVALID")
    }
    throw new UnauthorizedError("Token verification failed", "TOKEN_INVALID")
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): DecodedJwt | null {
  try {
    return jwt.decode(token) as DecodedJwt
  } catch {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(
  authHeader: string | undefined,
): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") return null

  return parts[1]
}
