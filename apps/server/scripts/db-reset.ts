import postgres from 'postgres'

const url = Bun.env['DATABASE_URL']
if (!url) {
	console.error('DATABASE_URL not set')
	process.exit(1)
}

const sql = postgres(url, { onnotice: () => {} })

// Managed Postgres (Neon) does not let app roles own `public`, so instead of
// DROP SCHEMA we drop every object inside it.
const tables = await sql<{ name: string }[]>`
	SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public'`
for (const { name } of tables) await sql.unsafe(`DROP TABLE IF EXISTS public."${name}" CASCADE`)

const types = await sql<{ name: string }[]>`
	SELECT t.typname AS name FROM pg_type t
	JOIN pg_namespace n ON n.oid = t.typnamespace
	WHERE n.nspname = 'public' AND t.typtype = 'e'`
for (const { name } of types) await sql.unsafe(`DROP TYPE IF EXISTS public."${name}" CASCADE`)

const sequences = await sql<{ name: string }[]>`
	SELECT sequencename AS name FROM pg_sequences WHERE schemaname = 'public'`
for (const { name } of sequences)
	await sql.unsafe(`DROP SEQUENCE IF EXISTS public."${name}" CASCADE`)

await sql.unsafe('DROP SCHEMA IF EXISTS drizzle CASCADE')
await sql.end()

console.log(`Dropped ${tables.length} tables, ${types.length} enums, ${sequences.length} sequences`)
