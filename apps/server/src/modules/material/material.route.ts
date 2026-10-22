import { z } from 'zod'

import { crudRoutes } from '@/server/crud-route.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

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
	return crudRoutes({
		prefix: '/material',
		resource: 'material',
		service: materialService,
		schemas: {
			filter: MaterialFilterDto,
			dto: MaterialDto,
			create: MaterialCreateDto,
			update: MaterialUpdateDto,
		},
	})
		.use(
			crudRoutes({
				prefix: '/category',
				resource: 'material',
				tags: ['material'],
				detail: false,
				service: categoryService,
				schemas: {
					filter: MaterialCategoryFilterDto,
					dto: MaterialCategoryDto,
					create: MaterialCategoryCreateDto,
					update: MaterialCategoryUpdateDto,
				},
			}),
		)
		.post(
			'/assignment/assign',
			async ({ body, actor }) => res.created(await assignmentService.handleAssign(body, actor)),
			{
				body: MaterialAssignDto,
				response: zRes.created(EntityRefDto),
				permission: 'material.create',
			},
		)
		.post(
			'/assignment/unassign',
			async ({ body, actor }) => res.ok(await assignmentService.handleUnassign(body, actor)),
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
