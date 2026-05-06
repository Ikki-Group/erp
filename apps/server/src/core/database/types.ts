import type { ReturnDbClient } from '@/db'

export type DbClient = ReturnDbClient
export type DbTx = Parameters<Parameters<DbClient['transaction']>[0]>[0]
