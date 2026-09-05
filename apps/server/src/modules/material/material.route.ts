import { Elysia } from 'elysia'
import { z } from 'zod'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
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

export function createMaterialRoute(
	materialService: MaterialService,
	categoryService: CategoryService,
	assignmentService: AssignmentService,
) {
	return new Elysia({ prefix: '/material', tags: ['material'] })
		.use(rbac.as('scoped'))
		.get('/list', async ({ query }) => res.paginated(await materialService.handleList(query)), {
			query: MaterialFilterDto,
			response: zRes.paginated(MaterialDto),
			permission: 'material.read',
		})
		.get('/detail', async ({ query }) => res.ok(await materialService.handleGetById(query.id)), {
			query: zq.recordId,
			response: zRes.ok(MaterialDto),
			permission: 'material.read',
		})
		.post(
			'/create',
			async ({ body, auth }) => res.created(await materialService.handleCreate(body, auth.userId)),
			{
				body: MaterialCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'material.create',
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await materialService.handleUpdate(body, auth.userId)),
			{
				body: MaterialUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'material.update',
			},
		)
		.delete(
			'/remove',
			async ({ query, auth }) => res.ok(await materialService.handleDelete(query.id, auth.userId)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'material.delete',
			},
		)
		.get(
			'/category/list',
			async ({ query }) => res.paginated(await categoryService.handleList(query)),
			{
				query: MaterialCategoryFilterDto,
				response: zRes.paginated(MaterialCategoryDto),
				permission: 'material.read',
			},
		)
		.post(
			'/category/create',
			async ({ body, auth }) => res.created(await categoryService.handleCreate(body, auth.userId)),
			{
				body: MaterialCategoryCreateDto,
				response: zRes.created(EntityRefDto),
				permission: 'material.create',
			},
		)
		.put(
			'/category/update',
			async ({ body, auth }) => res.ok(await categoryService.handleUpdate(body, auth.userId)),
			{
				body: MaterialCategoryUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'material.update',
			},
		)
		.delete(
			'/category/remove',
			async ({ query, auth }) => res.ok(await categoryService.handleDelete(query.id, auth.userId)),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'material.delete',
			},
		)
		.post(
			'/assignment/assign',
			async ({ body, auth }) =>
				res.created(await assignmentService.handleAssign(body, auth.userId)),
			{
				body: MaterialAssignDto,
				response: zRes.created(EntityRefDto),
				permission: 'material.create',
			},
		)
		.post(
			'/assignment/unassign',
			async ({ body, auth }) => res.ok(await assignmentService.handleUnassign(body, auth.userId)),
			{
				body: MaterialAssignDto,
				response: zRes.ok(EntityRefDto),
				permission: 'material.delete',
			},
		)
		.get(
			'/assignment/by-location',
			async ({ query }) => res.ok(await assignmentService.handleByLocation(query.locationId)),
			{
				query: z.object({ locationId: z.coerce.number().int().positive() }),
				response: zRes.ok(z.array(MaterialLocationDto)),
				permission: 'material.read',
			},
		)
		.get(
			'/assignment/by-material',
			async ({ query }) => res.ok(await assignmentService.handleByMaterial(query.materialId)),
			{
				query: z.object({ materialId: z.coerce.number().int().positive() }),
				response: zRes.ok(z.array(MaterialLocationDto)),
				permission: 'material.read',
			},
		)
}
