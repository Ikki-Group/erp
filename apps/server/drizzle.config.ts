import { defineConfig } from 'drizzle-kit'

// Tooling (knip) loads this file with no environment, so a missing URL must not
// throw. drizzle-kit commands that actually connect still fail on the bad URL.
const url = Bun.env['DATABASE_URL'] ?? 'postgres://localhost:5432/postgres'

export default defineConfig({
	schema: './src/db/schema/index.ts',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: { url },
	verbose: true,
	strict: true,
	breakpoints: true,
})
