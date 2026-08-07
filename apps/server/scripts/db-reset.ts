import postgres from 'postgres'

const url = Bun.env['DATABASE_URL']
if (!url) {
	console.error('DATABASE_URL not set')
	process.exit(1)
}

const sql = postgres(url)

const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
console.log('Existing tables:', tables.map((t) => t.tablename))

if (tables.length > 0) {
	await sql.unsafe('DROP SCHEMA public CASCADE')
	await sql.unsafe('CREATE SCHEMA public')
	console.log('Dropped and recreated public schema')
} else {
	console.log('No tables to drop')
}

await sql.unsafe('DROP SCHEMA IF EXISTS drizzle CASCADE')
console.log('Dropped drizzle schema (migration tracking reset)')

await sql.end()
console.log('Done - DB is clean')
