import type { db } from '@/db'

/** The top-level Drizzle client (connection pool). */
export type DbClient = typeof db

/** A transaction handle — same query surface as the client, minus `.transaction`. */
export type DbTx = Parameters<Parameters<DbClient['transaction']>[0]>[0]

/**
 * Anything a repo can run queries against: the pooled client OR an open
 * transaction. Repo methods accept `db?: DbContext = this.db` so a service can
 * thread its `DbTx` through for atomic multi-write operations.
 */
export type DbContext = DbTx | DbClient
