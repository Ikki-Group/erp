import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/database/schema',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: Bun.env.DATABASE_URL as string,
  },
  verbose: true,
  strict: true,
})
