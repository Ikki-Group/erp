import { endpoint } from '@/config/endpoint.ts'

import type { UomCreateDto, UomUpdateDto } from '@/features/uom/dto/index.ts'

import { createTable, paginate } from '../db.ts'
import { mockUomSeed } from '../fixtures/uom.ts'
import { mockError, mockPaginated, mockSuccess } from '../response.ts'
import { registerRoute } from '../router.ts'

const table = createTable(mockUomSeed)

registerRoute('get', endpoint.uom.list, (params) => {
	const page = Number(params.get('page') ?? 1)
	const limit = Number(params.get('limit') ?? 10)
	const q = params.get('q')?.toLowerCase()
	const category = params.get('category')

	let items = table.all()
	if (q)
		items = items.filter(
			(u) => u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q),
		)
	if (category) items = items.filter((u) => u.category === category)

	return mockPaginated(paginate(items, page, limit), { page, limit, total: items.length })
})

registerRoute('get', endpoint.uom.detail, (params) => {
	const id = Number(params.get('id'))
	const row = table.get(id)
	if (!row) return mockError(404, 'Unit tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess(row)
})

registerRoute('post', endpoint.uom.create, (_params, body) => {
	const input = body as UomCreateDto
	const row = table.insert({
		...input,
		createdAt: new Date(),
		updatedAt: new Date(),
		createdBy: 1,
		updatedBy: 1,
	})
	return mockSuccess({ id: row.id })
})

registerRoute('put', endpoint.uom.update, (_params, body) => {
	const input = body as UomUpdateDto
	const row = table.update(input.id, { ...input, updatedAt: new Date(), updatedBy: 1 })
	if (!row) return mockError(404, 'Unit tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess({ id: row.id })
})

registerRoute('delete', endpoint.uom.remove, (params) => {
	const id = Number(params.get('id'))
	const removed = table.remove(id)
	if (!removed) return mockError(404, 'Unit tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess({ id })
})
