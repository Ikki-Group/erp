import { defineConfig } from 'drizzle-kit'

const url = Bun.env.DATABASE_URL
if (!url) {
	throw new Error('Bun.env.DATABASE_URL')
}

export default defineConfig({
	schema: './src/db/schema/index.ts',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: { url },
	verbose: true,
	strict: true,
})
