import { db } from './client.ts'
import type { Tx } from './client.ts'

/** Runs `fn` inside one DB transaction; commits on return, rolls back on throw. */
export const uow = {
	run<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
		return db.transaction((tx) => fn(tx))
	},
}

export type UnitOfWork = typeof uow
