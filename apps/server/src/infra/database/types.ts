import type { db } from '@/db'

export type DbClient = typeof db
export type DbTx = Parameters<Parameters<DbClient['transaction']>[0]>[0]
