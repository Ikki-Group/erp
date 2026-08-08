/**
 * Database script helper with safety guards.
 * Usage: bun run scripts/db-scripts-helper.ts <command>
 * Commands: reset | seed | all (reset + seed)
 *
 * Safety: Only runs if:
 *   - NODE_ENV=development + DATABASE_URL contains "dev-user"
 *   - NODE_ENV=test + DATABASE_URL contains "test-user"
 */

// ─── Safety Guard ───

function assertDevOrTest(): void {
	const nodeEnv = process.env['NODE_ENV']
	const dbUrl = process.env['DATABASE_URL'] ?? ''

	const isDev = nodeEnv === 'development' && dbUrl.includes('dev-user')
	const isTest = nodeEnv === 'test' && dbUrl.includes('test-user')

	if (!isDev && !isTest) {
		console.log(
			`[db-scripts-helper] Safety guard: skipping. NODE_ENV=${nodeEnv}, URL pattern not matched.`,
		)
		process.exit(0)
	}

	console.log(`[db-scripts-helper] Guard passed: env=${nodeEnv}`)
}

// ─── Commands ───

async function runReset(): Promise<void> {
	console.log('[db-scripts-helper] Running reset...')
	const { execSync } = await import('node:child_process')
	// Drop schema and recreate
	execSync('bun run scripts/db-reset.ts', { stdio: 'inherit', cwd: import.meta.dir + '/..' })
	// Run migrations
	execSync('bunx --bun drizzle-kit migrate', { stdio: 'inherit', cwd: import.meta.dir + '/..' })
	console.log('[db-scripts-helper] Reset complete.')
}

async function runSeed(): Promise<void> {
	console.log('[db-scripts-helper] Running seed...')
	const { execSync } = await import('node:child_process')
	execSync('bun run scripts/seed.ts', { stdio: 'inherit', cwd: import.meta.dir + '/..' })
	console.log('[db-scripts-helper] Seed complete.')
}

// ─── Main ───

const command = process.argv[2]

if (!command || !['reset', 'seed', 'all'].includes(command)) {
	console.error('Usage: bun run scripts/db-scripts-helper.ts <reset|seed|all>')
	process.exit(1)
}

assertDevOrTest()

if (command === 'reset' || command === 'all') {
	await runReset()
}

if (command === 'seed' || command === 'all') {
	await runSeed()
}

console.log('[db-scripts-helper] Done.')
