import { Elysia } from 'elysia'

import { pool } from '@/infra/database/client.ts'
import { uow } from '@/infra/database/index.ts'
import { toHttpError } from '@/infra/database/pg-errors.ts'
import { errorPlugin } from '@/server/plugins/error.plugin.ts'
import { createMemoryRateLimitStore, rateLimitPlugin } from '@/server/plugins/rate-limit.plugin.ts'

import { loginAs } from '../helpers/auth.ts'
import { GET, POST, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

function pgError(code: string): Error {
	return Object.assign(new Error(`pg ${code}`), { code })
}

describe('pg error mapping', () => {
	test('unique violation hit past the pre-check returns 409 CONFLICT through a real route', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const code = `T${crypto.randomUUID().slice(0, 8)}`
		const holder = await pool.connect()
		try {
			// Uncommitted row: the route's conflict pre-check can't see it, but its insert blocks on the unique index.
			await holder.query('begin')
			await holder.query(
				`insert into locations (code, name, type) values ($1, 'holder', 'store')`,
				[code],
			)
			const pending = POST('/location/create', {
				token,
				body: { code, name: 'racer', type: 'store', address: null, phone: null },
			})
			await Bun.sleep(300)
			await holder.query('commit')

			const response = await pending
			expect(response.status).toBe(409)
			const body = await json(response)
			expect(body.error.code).toBe('CONFLICT')
			expect(body.error.context).toMatchObject({ constraint: 'locations_code_uniq' })
			expect(JSON.stringify(body)).not.toContain(code)
		} finally {
			await holder.query('delete from locations where code = $1', [code])
			holder.release()
		}
	})

	test('maps wrapped driver errors via the cause chain', () => {
		const wrapped = (c: string) => new Error('Failed query', { cause: pgError(c) })
		expect(toHttpError(wrapped('23503'))?.code).toBe('REFERENCE_CONFLICT')
		expect(toHttpError(wrapped('23514'))?.statusCode).toBe(422)
		expect(toHttpError(wrapped('40P01'))?.statusCode).toBe(503)
		expect(toHttpError(new Error('plain'))).toBeUndefined()
	})
})

describe('unit of work retry', () => {
	test('retries the transaction on deadlock and succeeds', async () => {
		let attempts = 0
		const result = await uow.run(async (tx) => {
			attempts++
			await tx.execute('select 1')
			if (attempts === 1) throw pgError('40P01')
			return 'ok'
		})
		expect(result).toBe('ok')
		expect(attempts).toBe(2)
	})

	test('gives up after 3 attempts on persistent serialization failures', async () => {
		let attempts = 0
		const run = uow.run(async () => {
			attempts++
			throw new Error('Failed query', { cause: pgError('40001') })
		})
		expect(run).rejects.toThrow()
		await run.catch(() => {})
		expect(attempts).toBe(3)
	})

	test('does not retry non-retryable errors', async () => {
		let attempts = 0
		await uow
			.run(async () => {
				attempts++
				throw pgError('23505')
			})
			.catch(() => {})
		expect(attempts).toBe(1)
	})
})

describe('rate limit', () => {
	test('returns 429 with Retry-After after max attempts', async () => {
		const app = new Elysia()
			.use(errorPlugin)
			.use(
				rateLimitPlugin({
					name: 'test-login',
					max: 3,
					windowSeconds: 60,
					enabled: true,
					store: createMemoryRateLimitStore(),
				}),
			)
			.post('/login', () => ({ ok: true }), { rateLimit: true })

		const attempt = (username: string, ip = '203.0.113.7') =>
			app.handle(
				new Request('http://localhost/login', {
					method: 'POST',
					headers: { 'content-type': 'application/json', 'fly-client-ip': ip },
					body: JSON.stringify({ username, password: 'x' }),
				}),
			)

		for (let i = 0; i < 3; i++) expect((await attempt('alice')).status).toBe(200)
		const limited = await attempt('alice')
		expect(limited.status).toBe(429)
		expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0)
		expect((await json(limited)).error.code).toBe('RATE_LIMITED')

		// Different username or IP gets its own window.
		expect((await attempt('bob')).status).toBe(200)
		expect((await attempt('alice', '198.51.100.1')).status).toBe(200)
	})
})

describe('readiness', () => {
	test('GET /ready returns 200 when the database is reachable', async () => {
		const response = await GET('/ready')
		expect(response.status).toBe(200)
		expect(await json<{ status: string }>(response)).toEqual({ status: 'ready' })
	})
})
