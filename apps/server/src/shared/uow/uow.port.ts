import type { Tx } from '@/infra/database/client.ts'

export interface UnitOfWork {
	/** Runs fn inside one DB transaction; commits on return and rolls back on throw. */
	run<T>(fn: (tx: Tx) => Promise<T>): Promise<T>
}
