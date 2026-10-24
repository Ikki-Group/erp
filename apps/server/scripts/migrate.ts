/**
 * Production-safe migration runner (no drizzle-kit needed at runtime).
 * Usage:
 *   bun run scripts/migrate.ts        # from source
 *   ./dist/migrate                    # compiled binary (Fly release_command: /app/migrate)
 *
 * Env:
 *   DATABASE_URL    required
 *   MIGRATIONS_DIR  optional; defaults to `<binary dir>/migrations` when compiled,
 *                   `src/db/migrations` when run from source.
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import { dirname, join, resolve } from 'node:path'

function resolveMigrationsFolder(): string {
	const fromEnv = process.env['MIGRATIONS_DIR']
	if (fromEnv) return resolve(fromEnv)

	// Compiled binaries embed sources in a virtual FS (`/$bunfs/…`, `B:\~BUN\…` on Windows),
	// so migrations ship next to the executable instead.
	const isCompiled = import.meta.dir.startsWith('/$bunfs') || import.meta.dir.includes('~BUN')
	return isCompiled
		? join(dirname(process.execPath), 'migrations')
		: resolve(import.meta.dir, '../src/db/migrations')
}

const connectionString = process.env['DATABASE_URL']
if (!connectionString) {
	console.error('[migrate] DATABASE_URL is required')
	process.exit(1)
}

const migrationsFolder = resolveMigrationsFolder()
const pool = new Pool({ connectionString, max: 1 })

let exitCode = 0
try {
	console.log(`[migrate] Applying migrations from ${migrationsFolder}`)
	await migrate(drizzle({ client: pool }), { migrationsFolder })
	console.log('[migrate] Done.')
} catch (error) {
	console.error('[migrate] Failed:', error)
	exitCode = 1
} finally {
	await pool.end()
}

process.exit(exitCode)
