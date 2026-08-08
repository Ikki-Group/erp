import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'
import { zq } from '@/shared/schema/index.ts'

import { MaterialAssignDto } from './assignment/assignment.contract.ts'
import type { AssignmentService } from './assignment/assignment.service.ts'
import {
	MaterialCategoryCreateDto,
	MaterialCategoryFilterDto,
	MaterialCategoryUpdateDto,
} from './category/category.contract.ts'
import type { CategoryService } from './category/category.service.ts'
import { MaterialCreateDto, MaterialFilterDto, MaterialUpdateDto } from './material.contract.ts'
import type { MaterialService } from './material.service.ts'

// ─── Route Factory ───

export function createMaterialRoute(
	materialService: MaterialService,
	categoryService: CategoryService,
	assignmentService: AssignmentService,
) {
	return (
		new Elysia({ prefix: '/material' })
			.use(authPluginMacro)

			// ─── Material CRUD ───

			.get(
				'/list',
				async ({ query }) => {
					const result = await materialService.handleList(query)
					return res.paginated(result)
				},
				{ query: MaterialFilterDto },
			)
			.get(
				'/detail',
				async ({ query }) => {
					const result = await materialService.handleGetById(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)
			.post(
				'/create',
				async ({ body, auth }) => {
					const result = await materialService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: MaterialCreateDto },
			)
			.put(
				'/update',
				async ({ body, auth }) => {
					const result = await materialService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: MaterialUpdateDto },
			)
			.delete(
				'/remove',
				async ({ query, auth }) => {
					const result = await materialService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)

			// ─── Category CRUD ───

			.get(
				'/category/list',
				async ({ query }) => {
					const result = await categoryService.handleList(query)
					return res.paginated(result)
				},
				{ query: MaterialCategoryFilterDto },
			)
			.post(
				'/category/create',
				async ({ body, auth }) => {
					const result = await categoryService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: MaterialCategoryCreateDto },
			)
			.put(
				'/category/update',
				async ({ body, auth }) => {
					const result = await categoryService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: MaterialCategoryUpdateDto },
			)
			.delete(
				'/category/remove',
				async ({ query, auth }) => {
					const result = await categoryService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)

			// ─── Assignment ───

			.post(
				'/assignment/assign',
				async ({ body, auth }) => {
					const result = await assignmentService.handleAssign(body, auth.userId)
					return res.created(result)
				},
				{ body: MaterialAssignDto },
			)
			.post(
				'/assignment/unassign',
				async ({ body, auth }) => {
					const result = await assignmentService.handleUnassign(body, auth.userId)
					return res.ok(result)
				},
				{ body: MaterialAssignDto },
			)
			.get(
				'/assignment/by-location',
				async ({ query }) => {
					const result = await assignmentService.handleByLocation(query.locationId)
					return res.ok(result)
				},
				{ query: z.object({ locationId: z.coerce.number().int().positive() }) },
			)
	)
}
