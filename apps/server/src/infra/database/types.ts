import type { db } from '@/db'

/** Top-level Drizzle client (connection pool). */
export type DbClient = typeof db

/** Transaction handle — same query surface as client, minus `.transaction`. */
export type DbTx = Parameters<Parameters<DbClient['transaction']>[0]>[0]

/** Anything a repo can run queries against: pooled client OR open transaction. */
export type DbContext = DbTx | DbClient
