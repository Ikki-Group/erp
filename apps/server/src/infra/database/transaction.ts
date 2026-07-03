import type { DbClient, DbContext, DbTx } from './types'

/**
 * Runs `fn` inside a database transaction.
 *
 * If `db` is already a transaction handle (`DbTx`), the callback runs in that
 * existing transaction (no nesting) so callers can safely compose. If `db` is a
 * top-level client, a new transaction is opened.
 *
 * Standardizes multi-write atomicity: services open a transaction here and
 * thread the resulting `DbTx` into every repo write (each repo write accepts an
 * optional `db` override) so the whole operation commits or rolls back together.
 *
 * @example
 * await withTransaction(this.repo.db, async (tx) => {
 *   const { id } = await this.repo.insert(data, tx)
 *   await this.deps.assignment.replaceByUserId(id, roleIds, tx)
 *   return { id }
 * })
 */
export async function withTransaction<T>(db: DbContext, fn: (tx: DbTx) => Promise<T>): Promise<T> {
	if (isTopLevelClient(db)) {
		return db.transaction(fn)
	}
	// Already inside a transaction — reuse it (no nesting).
	return fn(db)
}

/**
 * Narrows a `DbContext` to the top-level client. Only the top-level `DbClient`
 * exposes a `.transaction` method; a `DbTx` handle does not.
 */
function isTopLevelClient(db: DbContext): db is DbClient {
	return typeof (db as { transaction?: unknown }).transaction === 'function'
}
