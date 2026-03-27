import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  dbCredentials: { url: Bun.env.DATABASE_URL as string },
  verbose: true,
  strict: true,
})
