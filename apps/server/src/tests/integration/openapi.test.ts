import { testApp } from '../helpers/app.ts'
import { GET, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { beforeAll, describe, expect, test } from 'bun:test'

interface Operation {
	summary?: string
	tags?: string[]
	security?: Record<string, string[]>[]
	'x-permission'?: string
}

interface Spec {
	tags: { name: string }[]
	'x-tagGroups': { name: string; tags: string[] }[]
	paths: Record<string, Record<string, Operation>>
}

/** Routes anyone may call; every other operation must be guarded. */
const PUBLIC = ['POST /auth/login', 'POST /auth/token']

function tokenRequest(form: Record<string, string>): Promise<Response> {
	return testApp.handle(
		new Request('http://localhost/auth/token', {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams(form),
		}),
	)
}

describe('API docs', () => {
	let spec: Spec
	let operations: [string, Operation][]

	beforeAll(async () => {
		const res = await GET('/openapi/json')
		expect(res.status).toBe(200)
		spec = await json<Spec>(res)
		operations = Object.entries(spec.paths).flatMap(([path, methods]) =>
			Object.entries(methods).map(([method, op]): [string, Operation] => [
				`${method.toUpperCase()} ${path}`,
				op,
			]),
		)
	})

	test('every operation has a summary and exactly one grouped tag', () => {
		const grouped = new Set(spec['x-tagGroups'].flatMap((group) => group.tags))
		expect(new Set(spec.tags.map((tag) => tag.name))).toEqual(grouped)
		const offenders = operations
			.filter(([, op]) => !op.summary || op.tags?.length !== 1 || !grouped.has(op.tags[0] ?? ''))
			.map(([name, op]) => `${name} summary=${op.summary} tags=${op.tags?.join('|')}`)
		expect(offenders).toEqual([])
	})

	test('guarded operations declare security and their permission; public ones do not', () => {
		const offenders = operations
			.filter(([name, op]) =>
				PUBLIC.includes(name) ? op.security !== undefined : !op.security || !op['x-permission'],
			)
			.map(([name]) => name)
		expect(offenders).toEqual([])
	})

	test('request schemas treat defaulted query fields as optional', () => {
		const list = spec.paths['/location/list']?.get as {
			parameters: { name: string; required: boolean }[]
		}
		const page = list.parameters.find((param) => param.name === 'page')
		expect(page?.required).toBe(false)
	})
})

describe('POST /auth/token (OAuth2 password grant)', () => {
	test('issues a bearer token that authenticates API calls', async () => {
		const res = await tokenRequest({
			grant_type: 'password',
			username: SEED_USERS.owner.username,
			password: SEED_USERS.owner.password,
		})
		expect(res.status).toBe(200)
		const body = await json<{ access_token: string; token_type: string; expires_in: number }>(res)
		expect(body.token_type).toBe('Bearer')
		expect(body.expires_in).toBeGreaterThan(0)

		const me = await GET('/auth/me', { token: body.access_token })
		expect(me.status).toBe(200)
		expect((await json(me)).data.user.username).toBe(SEED_USERS.owner.username)
	})

	test('rejects wrong credentials and other grant types', async () => {
		const wrong = await tokenRequest({
			grant_type: 'password',
			username: SEED_USERS.owner.username,
			password: 'not-the-password',
		})
		expect(wrong.status).toBe(401)

		const grant = await tokenRequest({
			grant_type: 'client_credentials',
			username: SEED_USERS.owner.username,
			password: SEED_USERS.owner.password,
		})
		expect(grant.status).toBe(422)
	})

	test('an empty X-Location-ID header means no active location', async () => {
		const res = await tokenRequest({
			grant_type: 'password',
			username: SEED_USERS.cashier.username,
			password: SEED_USERS.cashier.password,
		})
		const { access_token: token } = await json<{ access_token: string }>(res)
		const me = await GET('/auth/me', { token, headers: { 'x-location-id': '' } })
		expect(me.status).toBe(200)
	})
})
