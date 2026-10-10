import { zRes } from '@ikki/contract/http'
import {
	MaterialCreateDto,
	MaterialDto,
	MaterialFilterDto,
	MaterialUpdateDto,
} from '@ikki/contract/material'
import { MaterialAssignDto, MaterialLocationDto } from '@ikki/contract/material/assignment'
import {
	MaterialCategoryCreateDto,
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryUpdateDto,
} from '@ikki/contract/material/category'
import { EntityRefDto, zq } from '@ikki/contract/schema'
import { Elysia } from 'elysia'
import { z } from 'zod'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { res } from '@/shared/http/response.ts'

import type { AssignmentService } from './assignment/assignment.service.ts'
import type { CategoryService } from './category/category.service.ts'
import type { MaterialService } from './material.service.ts'

export function createMaterialRoute(
	materialService: MaterialService,
	categoryService: CategoryService,
	assignmentService: AssignmentService,
) {
	return new Elysia({ prefix: '/material', tags: ['material'] })
		.use(authGuard)
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
			async ({ body, auth }) => res.ok(await materialService.handleCreate(body, actorOf(auth))),
			{
				body: MaterialCreateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'material.create',
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await materialService.handleUpdate(body, actorOf(auth))),
			{
				body: MaterialUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'material.update',
			},
		)
		.delete(
			'/remove',
			async ({ query, auth }) =>
				res.ok(await materialService.handleDelete(query.id, actorOf(auth))),
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
			async ({ body, auth }) => res.ok(await categoryService.handleCreate(body, actorOf(auth))),
			{
				body: MaterialCategoryCreateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'material.create',
			},
		)
		.put(
			'/category/update',
			async ({ body, auth }) => res.ok(await categoryService.handleUpdate(body, actorOf(auth))),
			{
				body: MaterialCategoryUpdateDto,
				response: zRes.ok(EntityRefDto),
				permission: 'material.update',
			},
		)
		.delete(
			'/category/remove',
			async ({ query, auth }) =>
				res.ok(await categoryService.handleDelete(query.id, actorOf(auth))),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: 'material.delete',
			},
		)
		.post(
			'/assignment/assign',
			async ({ body, auth }) => res.ok(await assignmentService.handleAssign(body, actorOf(auth))),
			{
				body: MaterialAssignDto,
				response: zRes.ok(EntityRefDto),
				permission: 'material.create',
			},
		)
		.post(
			'/assignment/unassign',
			async ({ body, auth }) => res.ok(await assignmentService.handleUnassign(body, actorOf(auth))),
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
