import type { DbClient, DbContext, DbTx } from './types'

/**
 * Run `fn` inside a transaction. If `db` is already a transaction, reuses it.
 *
 * @example
 * await withTransaction(this.repo.db, async (tx) => {
 *   await this.repo.insert(data, tx)
 *   await this.deps.child.replaceByParentId(id, items, tx)
 * })
 */
export async function withTransaction<T>(db: DbContext, fn: (tx: DbTx) => Promise<T>): Promise<T> {
	if (isTopLevelClient(db)) {
		return db.transaction(fn)
	}
	return fn(db)
}

function isTopLevelClient(db: DbContext): db is DbClient {
	return typeof (db as { transaction?: unknown }).transaction === 'function'
}
