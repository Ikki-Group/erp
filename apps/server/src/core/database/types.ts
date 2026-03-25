import type { db } from '@/db'

export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0]
