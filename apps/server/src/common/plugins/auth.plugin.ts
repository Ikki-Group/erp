import { Elysia } from "elysia"
import { config } from "@/core/config"
import { UnauthorizedError } from "@/core/errors"
import type { AuthUser, JwtPayload } from "@/core/types"

/**
 * JWT Authentication plugin
 * Provides authentication macro and user context
 */
export const authPlugin = new Elysia({ name: "Auth.Plugin" })
  .derive({ as: "scoped" }, async ({ request }) => {
    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return { user: null }
    }

    const token = authHeader.slice(7)

    try {
      const payload = await verifyJwt(token)
      const user: AuthUser = {
        id: payload.sub,
        email: payload.email,
      }
      return { user }
    } catch {
      return { user: null }
    }
  })
  .macro({
    requireAuth: {
      resolve({ user, status }) {
        if (!user) {
          throw status(401, new UnauthorizedError("Authentication required"))
        }
        return { user: user as AuthUser }
      },
    },
  })

/**
 * Sign a JWT token
 */
export async function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = parseExpiresIn(config.JWT_EXPIRES_IN)

  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  }

  // Using Bun's native JWT signing
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(config.JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = btoa(JSON.stringify(fullPayload))
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${header}.${body}`),
  )

  return `${header}.${body}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJwt(token: string): Promise<JwtPayload> {
  const [header, body, signature] = token.split(".")

  if (!header || !body || !signature) {
    throw new UnauthorizedError("Invalid token format")
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(config.JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  )

  const signatureBytes = Uint8Array.from(atob(signature), (c) =>
    c.charCodeAt(0),
  )
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(`${header}.${body}`),
  )

  if (!isValid) {
    throw new UnauthorizedError("Invalid token signature")
  }

  const payload = JSON.parse(atob(body)) as JwtPayload

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedError("Token expired")
  }

  return payload
}

/**
 * Parse expires-in string to seconds
 */
function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/)
  if (!match) return 3600 // default 1 hour

  const num = parseInt(match[1]!, 10)
  const unit = match[2]

  switch (unit) {
    case "s":
      return num
    case "m":
      return num * 60
    case "h":
      return num * 3600
    case "d":
      return num * 86400
    default:
      return 3600
  }
}
