import type { Tx } from '@/infra/database/client.ts'

export interface UnitOfWork {
	/**
	 * Runs fn inside one DB transaction; commits on return and rolls back on throw.
	 *
	 * On deadlock (40P01) or serialization failure (40001) the whole transaction
	 * is retried (up to 3 attempts, jittered backoff), so `fn` MUST be
	 * re-runnable: no external side effects (cache invalidation, event publish,
	 * HTTP calls) inside it — do those after `run` resolves. Nested transactions
	 * (`tx.transaction`) are savepoints and never retry on their own.
	 */
	run<T>(fn: (tx: Tx) => Promise<T>): Promise<T>
}
