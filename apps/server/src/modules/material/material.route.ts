import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import { MaterialAssignDto, MaterialLocationDto } from './assignment/assignment.contract.ts'
import type { AssignmentService } from './assignment/assignment.service.ts'
import {
	MaterialCategoryCreateDto,
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryUpdateDto,
} from './category/category.contract.ts'
import type { CategoryService } from './category/category.service.ts'
import {
	MaterialCreateDto,
	MaterialDto,
	MaterialFilterDto,
	MaterialUpdateDto,
} from './material.contract.ts'
import type { MaterialService } from './material.service.ts'

// ─── Route Factory ───

export function createMaterialRoute(
	materialService: MaterialService,
	categoryService: CategoryService,
	assignmentService: AssignmentService,
) {
	return (
		new Elysia({ prefix: '/material', tags: ['material'] })
			.use(authPluginMacro)

			// ─── Material CRUD ───

			.get(
				'/list',
				async ({ query }) => {
					const result = await materialService.handleList(query)
					return res.paginated(result)
				},
				{ query: MaterialFilterDto, response: zRes.paginated(MaterialDto) },
			)
			.get(
				'/detail',
				async ({ query }) => {
					const result = await materialService.handleGetById(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(MaterialDto) },
			)
			.post(
				'/create',
				async ({ body, auth }) => {
					const result = await materialService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: MaterialCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/update',
				async ({ body, auth }) => {
					const result = await materialService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: MaterialUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/remove',
				async ({ query, auth }) => {
					const result = await materialService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)

			// ─── Category CRUD ───

			.get(
				'/category/list',
				async ({ query }) => {
					const result = await categoryService.handleList(query)
					return res.paginated(result)
				},
				{ query: MaterialCategoryFilterDto, response: zRes.paginated(MaterialCategoryDto) },
			)
			.post(
				'/category/create',
				async ({ body, auth }) => {
					const result = await categoryService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: MaterialCategoryCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/category/update',
				async ({ body, auth }) => {
					const result = await categoryService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: MaterialCategoryUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/category/remove',
				async ({ query, auth }) => {
					const result = await categoryService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)

			// ─── Assignment ───

			.post(
				'/assignment/assign',
				async ({ body, auth }) => {
					const result = await assignmentService.handleAssign(body, auth.userId)
					return res.created(result)
				},
				{ body: MaterialAssignDto, response: zRes.created(EntityRefDto) },
			)
			.post(
				'/assignment/unassign',
				async ({ body, auth }) => {
					const result = await assignmentService.handleUnassign(body, auth.userId)
					return res.ok(result)
				},
				{ body: MaterialAssignDto, response: zRes.ok(EntityRefDto) },
			)
			.get(
				'/assignment/by-location',
				async ({ query }) => {
					const result = await assignmentService.handleByLocation(query.locationId)
					return res.ok(result)
				},
				{
					query: z.object({ locationId: z.coerce.number().int().positive() }),
					response: zRes.ok(z.array(MaterialLocationDto)),
				},
			)
			.get(
				'/assignment/by-material',
				async ({ query }) => {
					const result = await assignmentService.handleByMaterial(query.materialId)
					return res.ok(result)
				},
				{
					query: z.object({ materialId: z.coerce.number().int().positive() }),
					response: zRes.ok(z.array(MaterialLocationDto)),
				},
			)
	)
}
