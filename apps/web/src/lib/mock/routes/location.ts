import { mockLocationSeed } from '../fixtures/location.ts'
import { createTable, paginate } from '../db.ts'
import { mockError, mockPaginated, mockSuccess } from '../response.ts'
import { registerRoute } from '../router.ts'

import { endpoint } from '@/config/endpoint.ts'
import type { LocationCreateDto, LocationUpdateDto } from '@/features/location/dto/index.ts'

const table = createTable(mockLocationSeed)

registerRoute('get', endpoint.location.list, (params) => {
	const page = Number(params.get('page') ?? 1)
	const limit = Number(params.get('limit') ?? 10)
	const q = params.get('q')?.toLowerCase()
	const type = params.get('type')

	let items = table.all()
	if (q) items = items.filter((l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q))
	if (type) items = items.filter((l) => l.type === type)

	return mockPaginated(paginate(items, page, limit), { page, limit, total: items.length })
})

registerRoute('get', endpoint.location.detail, (params) => {
	const id = Number(params.get('id'))
	const row = table.get(id)
	if (!row) return mockError(404, 'Lokasi tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess(row)
})

registerRoute('post', endpoint.location.create, (_params, body) => {
	const input = body as LocationCreateDto
	const row = table.insert({
		...input,
		address: input.address ?? null,
		phone: input.phone ?? null,
		isActive: input.isActive ?? true,
		createdAt: new Date(),
		updatedAt: new Date(),
		createdBy: 1,
		updatedBy: 1,
	})
	return mockSuccess({ id: row.id })
})

registerRoute('put', endpoint.location.update, (_params, body) => {
	const input = body as LocationUpdateDto
	const row = table.update(input.id, { ...input, updatedAt: new Date(), updatedBy: 1 })
	if (!row) return mockError(404, 'Lokasi tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess({ id: row.id })
})

registerRoute('delete', endpoint.location.remove, (params) => {
	const id = Number(params.get('id'))
	const removed = table.remove(id)
	if (!removed) return mockError(404, 'Lokasi tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess({ id })
})
