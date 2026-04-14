import { db } from '@/db'
import { sql } from 'drizzle-orm'

async function main() {
	const resetSql = sql`
DROP SCHEMA drizzle CASCADE;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
`
	await db.execute(resetSql)
}

// oxlint-disable-next-line unicorn/prefer-top-level-await typescript/no-floating-promises
await main()
