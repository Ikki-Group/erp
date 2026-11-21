import { describe, expect, it } from 'vitest'

import { auditSearchSchema, toAuditListQuery } from './audit-search.ts'

describe('auditSearchSchema', () => {
	it('keeps date range, filters and the selected id from the URL', () => {
		const parsed = auditSearchSchema.parse({
			page: '2',
			pageSize: '25',
			q: 'kopi',
			module: ' menu ',
			action: 'update',
			dateFrom: '2026-10-01T00:00:00.000+07:00',
			dateTo: '2026-10-07T23:59:59.999Z',
			id: '42',
		})
		expect(parsed).toEqual({
			page: 2,
			pageSize: 25,
			q: 'kopi',
			module: 'menu',
			action: 'update',
			dateFrom: '2026-10-01T00:00:00.000+07:00',
			dateTo: '2026-10-07T23:59:59.999Z',
			id: 42,
		})
	})

	it('drops malformed optional values instead of failing the route', () => {
		const parsed = auditSearchSchema.parse({
			dateFrom: 'yesterday',
			dateTo: '2026-10-07',
			id: 'abc',
		})
		expect(parsed.dateFrom).toBeUndefined()
		expect(parsed.dateTo).toBeUndefined()
		expect(parsed.id).toBeUndefined()
		expect(auditSearchSchema.parse({ id: 0 }).id).toBeUndefined()
		expect(auditSearchSchema.parse({ id: -3 }).id).toBeUndefined()
		expect(auditSearchSchema.parse({ id: 1.5 }).id).toBeUndefined()
	})

	it('does not accept a sort from the URL', () => {
		expect(auditSearchSchema.parse({ sort: 'timestamp:asc' })).not.toHaveProperty('sort')
	})
})

describe('toAuditListQuery', () => {
	it('selecting a different row does not change the list query', () => {
		const base = { page: 1, pageSize: 10, module: 'iam' }
		expect(toAuditListQuery(auditSearchSchema.parse({ ...base, id: 1 }))).toEqual(
			toAuditListQuery(auditSearchSchema.parse({ ...base, id: 2 })),
		)
	})
})
