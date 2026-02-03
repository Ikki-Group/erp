import type { SQL } from 'drizzle-orm'

import { db } from '@/database'
import { logger } from '@/shared/logger'

/**
 * Transaction Utility
 *
 * Provides a wrapper for database transactions with automatic rollback on errors.
 *
 * Usage:
 * ```typescript
 * const result = await withTransaction(async (tx) => {
 *   const user = await tx.insert(users).values({...}).returning()
 *   const role = await tx.insert(userRoleAssignments).values({...}).returning()
 *   return { user, role }
 * })
 * ```
 */
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>,
  options?: { isolationLevel?: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable' }
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await db.transaction(callback, options)
    const duration = Date.now() - startTime

    logger.withMetadata({ duration, success: true }).debug('Transaction completed successfully')

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    logger
      .withMetadata({
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
      .error('Transaction failed and rolled back')

    throw error
  }
}

/**
 * Query Logger Utility
 *
 * Logs database queries with execution time for performance monitoring.
 *
 * Usage:
 * ```typescript
 * const result = await logQuery(
 *   'getUserById',
 *   () => db.select().from(users).where(eq(users.id, id))
 * )
 * ```
 */
export async function logQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await queryFn()
    const duration = Date.now() - startTime

    if (duration > 1000) {
      logger.withMetadata({ queryName, duration, slow: true }).warn('Slow query detected')
    } else {
      logger.withMetadata({ queryName, duration }).debug('Query executed')
    }

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    logger
      .withMetadata({
        queryName,
        duration,
        error: error instanceof Error ? error.message : String(error),
      })
      .error('Query failed')

    throw error
  }
}

/**
 * Build WHERE clause helper
 *
 * Filters out undefined conditions from WHERE clauses.
 *
 * Usage:
 * ```typescript
 * const where = buildWhere([
 *   search ? ilike(users.name, `%${search}%`) : undefined,
 *   isActive !== undefined ? eq(users.isActive, isActive) : undefined,
 * ])
 * ```
 */
export function buildWhere(conditions: (SQL | undefined)[]): SQL | undefined {
  const filtered = conditions.filter((c): c is SQL => c !== undefined)
  if (filtered.length === 0) return undefined
  if (filtered.length === 1) return filtered[0]

  // Use AND to combine multiple conditions
  const { and } = await import('drizzle-orm')
  return and(...filtered)
}
