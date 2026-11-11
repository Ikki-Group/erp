import { endpoint } from '@/config/endpoint.ts'

import type {
	MaterialAssignDto,
	MaterialCategoryCreateDto,
	MaterialCategoryUpdateDto,
	MaterialCreateDto,
	MaterialUpdateDto,
} from '@/features/material/dto/index.ts'

import { createTable, paginate } from '../db.ts'
import {
	mockMaterialCategorySeed,
	mockMaterialLocationSeed,
	mockMaterialSeed,
} from '../fixtures/material.ts'
import { mockError, mockPaginated, mockSuccess } from '../response.ts'
import { registerRoute } from '../router.ts'

const materials = createTable(mockMaterialSeed)
const categories = createTable(mockMaterialCategorySeed)
const assignments = createTable(mockMaterialLocationSeed)

// ─── Material CRUD ───

registerRoute('get', endpoint.material.list, (params) => {
	const page = Number(params.get('page') ?? 1)
	const limit = Number(params.get('limit') ?? 10)
	const q = params.get('q')?.toLowerCase()
	const categoryId = params.get('categoryId')
	const type = params.get('type')

	let items = materials.all()
	if (q)
		items = items.filter(
			(m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q),
		)
	if (categoryId) items = items.filter((m) => m.categoryId === Number(categoryId))
	if (type) items = items.filter((m) => m.type === type)

	return mockPaginated(paginate(items, page, limit), { page, limit, total: items.length })
})

registerRoute('get', endpoint.material.detail, (params) => {
	const id = Number(params.get('id'))
	const row = materials.get(id)
	if (!row) return mockError(404, 'Material tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess(row)
})

registerRoute('post', endpoint.material.create, (_params, body) => {
	const input = body as MaterialCreateDto
	const row = materials.insert({
		...input,
		categoryId: input.categoryId ?? null,
		defaultPurchaseUomId: input.defaultPurchaseUomId ?? null,
		defaultStockUomId: input.defaultStockUomId ?? null,
		defaultRecipeUomId: input.defaultRecipeUomId ?? null,
		minStock: input.minStock ?? null,
		isActive: input.isActive ?? true,
		createdAt: new Date(),
		updatedAt: new Date(),
		createdBy: 1,
		updatedBy: 1,
	})
	return mockSuccess({ id: row.id })
})

registerRoute('put', endpoint.material.update, (_params, body) => {
	const input = body as MaterialUpdateDto
	const row = materials.update(input.id, {
		...input,
		updatedAt: new Date(),
		updatedBy: 1,
	})
	if (!row) return mockError(404, 'Material tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess({ id: row.id })
})

registerRoute('delete', endpoint.material.remove, (params) => {
	const id = Number(params.get('id'))
	const removed = materials.remove(id)
	if (!removed) return mockError(404, 'Material tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess({ id })
})

// ─── Category CRUD ───

registerRoute('get', endpoint.material.category.list, (params) => {
	const page = Number(params.get('page') ?? 1)
	const limit = Number(params.get('limit') ?? 10)
	const q = params.get('q')?.toLowerCase()

	let items = categories.all()
	if (q) items = items.filter((c) => c.name.toLowerCase().includes(q))

	return mockPaginated(paginate(items, page, limit), { page, limit, total: items.length })
})

registerRoute('post', endpoint.material.category.create, (_params, body) => {
	const input = body as MaterialCategoryCreateDto
	const row = categories.insert({
		...input,
		createdAt: new Date(),
		updatedAt: new Date(),
		createdBy: 1,
		updatedBy: 1,
	})
	return mockSuccess({ id: row.id })
})

registerRoute('put', endpoint.material.category.update, (_params, body) => {
	const input = body as MaterialCategoryUpdateDto
	const row = categories.update(input.id, {
		...input,
		updatedAt: new Date(),
		updatedBy: 1,
	})
	if (!row) return mockError(404, 'Category tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess({ id: row.id })
})

registerRoute('delete', endpoint.material.category.remove, (params) => {
	const id = Number(params.get('id'))
	const removed = categories.remove(id)
	if (!removed) return mockError(404, 'Category tidak ditemukan.', 'NOT_FOUND')
	return mockSuccess({ id })
})

// ─── Location Assignment ───

registerRoute('get', endpoint.material.assignment.byLocation, (params) => {
	const locationId = Number(params.get('locationId'))
	const items = assignments.all().filter((a) => a.locationId === locationId)
	return mockSuccess(items)
})

registerRoute('get', endpoint.material.assignment.byMaterial, (params) => {
	const materialId = Number(params.get('materialId'))
	const items = assignments.all().filter((a) => a.materialId === materialId)
	return mockSuccess(items)
})

registerRoute('post', endpoint.material.assignment.assign, (_params, body) => {
	const input = body as MaterialAssignDto
	const row = assignments.insert({
		...input,
		createdAt: new Date(),
		updatedAt: new Date(),
		createdBy: 1,
		updatedBy: 1,
	})
	return mockSuccess({ id: row.id })
})

registerRoute('post', endpoint.material.assignment.unassign, (_params, body) => {
	const input = body as MaterialAssignDto
	const existing = assignments
		.all()
		.find((a) => a.materialId === input.materialId && a.locationId === input.locationId)
	if (!existing) return mockError(404, 'Assignment tidak ditemukan.', 'NOT_FOUND')
	assignments.remove(existing.id)
	return mockSuccess({ id: existing.id })
})
