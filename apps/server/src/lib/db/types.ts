import type { db } from '@/db'

/* -------------------------------------------------------------------------- */
/*                             Drizzle utility types                          */
/* -------------------------------------------------------------------------- */

/** The main Drizzle database instance type. */
export type Database = typeof db

/** A transaction context (same shape as `db` but scoped). */
export type DBTx = Parameters<Parameters<Database['transaction']>[0]>[0]

/** Shorthand for T | null */
export type Nullable<T> = T | null

/** Extract the column types of a table for select/insert operations. */
export type InferTable<T extends Record<string, unknown>> = T extends Record<string, unknown> ? T : never
