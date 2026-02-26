import type { PgQueryResultHKT, PgTransaction } from 'drizzle-orm/pg-core'

export type DbTx = PgTransaction<PgQueryResultHKT, {}>
