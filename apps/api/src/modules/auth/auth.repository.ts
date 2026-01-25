import { eq } from "drizzle-orm"
import { db } from "@/db"
import { users, sessions } from "@/db/schema"

/**
 * Auth repository - Data access layer for authentication
 * Using object-based pattern (no abstract class)
 */
export class AuthRepository {
  /**
   * Find user by email
   */
  async findUserByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return result[0] ?? null
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string) {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return result[0] ?? null
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string
    passwordHash: string
    name?: string
  }) {
    const result = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name ?? null,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      })

    return result[0]!
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return result.length > 0
  }

  /**
   * Create a session (for refresh tokens)
   */
  async createSession(data: {
    userId: string
    refreshToken: string
    expiresAt: Date
  }) {
    const result = await db.insert(sessions).values(data).returning()

    return result[0]!
  }

  /**
   * Delete session by refresh token
   */
  async deleteSession(refreshToken: string) {
    await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken))
  }
}

export const authRepository = new AuthRepository()
