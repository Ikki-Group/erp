import { auditLogs } from '@/db/schema/audit.ts'

import { and, db, eq } from '@/infra/database/index.ts'

import { loginAs } from '../helpers/auth.ts'
import { DELETE, GET, POST, PUT, json } from '../helpers/request.ts'
import { SEED_USERS } from '../helpers/seed.ts'
import { describe, expect, test } from 'bun:test'

async function auditActions(entityId: number): Promise<string[]> {
	const rows = await db
		.select({ action: auditLogs.action })
		.from(auditLogs)
		.where(
			and(
				eq(auditLogs.module, 'supplier'),
				eq(auditLogs.entity, 'supplier'),
				eq(auditLogs.entityId, entityId),
			),
		)
	return rows.map((row) => row.action).sort()
}

describe('supplier', () => {
	test('create → detail → update → list → soft delete, audited per mutation', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const suffix = crypto.randomUUID().slice(0, 8)
		const code = `SUP-${suffix}`

		const created = await POST('/supplier/create', {
			token,
			body: { code, name: `Supplier ${suffix}`, phone: '021-1111' },
		})
		expect(created.status).toBe(200)
		const id: number = (await json(created)).data.id

		const detail = await GET('/supplier/detail', { token, query: { id: String(id) } })
		expect(detail.status).toBe(200)
		expect((await json(detail)).data).toMatchObject({ code, isActive: true, phone: '021-1111' })

		const duplicate = await POST('/supplier/create', {
			token,
			body: { code, name: `Duplicate ${suffix}` },
		})
		expect(duplicate.status).toBe(409)
		expect((await json(duplicate)).error.code).toBe('SUPPLIER_CODE_EXISTS')

		const updated = await PUT('/supplier/update', {
			token,
			body: { id, code, name: `Updated ${suffix}`, isActive: true },
		})
		expect(updated.status).toBe(200)
		expect((await json(updated)).data).toEqual({ id })

		// Detail is cached; the update must have invalidated it.
		const afterUpdate = await GET('/supplier/detail', { token, query: { id: String(id) } })
		expect((await json(afterUpdate)).data.name).toBe(`Updated ${suffix}`)

		const listed = await GET('/supplier/list', { token, query: { q: suffix } })
		expect(listed.status).toBe(200)
		const listBody = await json(listed)
		expect(listBody.data).toEqual([expect.objectContaining({ id })])
		expect(listBody.meta).toMatchObject({ total: 1, page: 1 })

		const removed = await DELETE('/supplier/remove', { token, query: { id: String(id) } })
		expect(removed.status).toBe(200)

		// Soft delete: the row stays readable but inactive.
		const afterDelete = await GET('/supplier/detail', { token, query: { id: String(id) } })
		expect((await json(afterDelete)).data.isActive).toBe(false)

		expect(await auditActions(id)).toEqual(['create', 'delete', 'update'])
	})

	test('unknown supplier returns SUPPLIER_NOT_FOUND without writing an audit row', async () => {
		const token = await loginAs(SEED_USERS.owner.username)
		const missingId = 2_000_000_000

		const detail = await GET('/supplier/detail', { token, query: { id: String(missingId) } })
		expect(detail.status).toBe(404)
		expect((await json(detail)).error).toMatchObject({
			code: 'SUPPLIER_NOT_FOUND',
			context: { id: missingId },
		})

		const updated = await PUT('/supplier/update', {
			token,
			body: { id: missingId, code: 'SUP-MISSING', name: 'Missing supplier' },
		})
		expect(updated.status).toBe(404)
		expect((await json(updated)).error.code).toBe('SUPPLIER_NOT_FOUND')

		const removed = await DELETE('/supplier/remove', {
			token,
			query: { id: String(missingId) },
		})
		expect(removed.status).toBe(404)
		expect((await json(removed)).error.code).toBe('SUPPLIER_NOT_FOUND')

		expect(await auditActions(missingId)).toEqual([])
	})
})
