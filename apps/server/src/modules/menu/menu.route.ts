import { Elysia } from 'elysia'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import { MenuItemModifierSyncDto } from './assignment/assignment.contract.ts'
import type { AssignmentService } from './assignment/assignment.service.ts'
import {
	MenuCategoryCreateDto,
	MenuCategoryDto,
	MenuCategoryFilterDto,
	MenuCategoryUpdateDto,
} from './category/category.contract.ts'
import type { CategoryService } from './category/category.service.ts'
import { MenuItemDetailDto } from './composed/composed.contract.ts'
import type { ComposedService } from './composed/composed.service.ts'
import {
	MenuItemCreateDto,
	MenuItemDto,
	MenuItemFilterDto,
	MenuItemUpdateDto,
} from './item/item.contract.ts'
import type { ItemService } from './item/item.service.ts'
import {
	ModifierGroupCreateDto,
	ModifierGroupDto,
	ModifierGroupFilterDto,
	ModifierGroupUpdateDto,
	ModifierGroupWithOptionsDto,
} from './modifier/modifier.contract.ts'
import type { ModifierService } from './modifier/modifier.service.ts'

// ─── Route Factory ───

export function createMenuRoute(
	categoryService: CategoryService,
	itemService: ItemService,
	modifierService: ModifierService,
	assignmentService: AssignmentService,
	composedService: ComposedService,
) {
	return (
		new Elysia({ prefix: '/menu', tags: ['menu'] })
			.use(rbac.as('scoped'))

			// ─── Category Routes ───

			.get(
				'/category/list',
				async ({ query }) => {
					const result = await categoryService.handleList(query)
					return res.paginated(result)
				},
				{ query: MenuCategoryFilterDto, response: zRes.paginated(MenuCategoryDto) },
			)
			.post(
				'/category/create',
				async ({ body, auth }) => {
					const result = await categoryService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: MenuCategoryCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/category/update',
				async ({ body, auth }) => {
					const result = await categoryService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: MenuCategoryUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/category/remove',
				async ({ query, auth }) => {
					const result = await categoryService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)

			// ─── Menu Item Routes ───

			.get(
				'/item/list',
				async ({ query }) => {
					const result = await itemService.handleList(query)
					return res.paginated(result)
				},
				{ query: MenuItemFilterDto, response: zRes.paginated(MenuItemDto) },
			)
			.get(
				'/item/detail',
				async ({ query }) => {
					const result = await composedService.handleDetail(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(MenuItemDetailDto) },
			)
			.post(
				'/item/create',
				async ({ body, auth }) => {
					const result = await itemService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: MenuItemCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/item/update',
				async ({ body, auth }) => {
					const result = await itemService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: MenuItemUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/item/remove',
				async ({ query, auth }) => {
					const result = await itemService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)

			// ─── Item Modifier Assignment ───

			.post(
				'/item/modifiers/sync',
				async ({ body, auth }) => {
					const result = await assignmentService.handleSync(body, auth.userId)
					return res.ok(result)
				},
				{ body: MenuItemModifierSyncDto, response: zRes.ok(EntityRefDto) },
			)

			// ─── Modifier Group Routes ───

			.get(
				'/modifier/list',
				async ({ query }) => {
					const result = await modifierService.handleList(query)
					return res.paginated(result)
				},
				{ query: ModifierGroupFilterDto, response: zRes.paginated(ModifierGroupDto) },
			)
			.get(
				'/modifier/detail',
				async ({ query }) => {
					const result = await modifierService.handleDetail(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(ModifierGroupWithOptionsDto) },
			)
			.post(
				'/modifier/create',
				async ({ body, auth }) => {
					const result = await modifierService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: ModifierGroupCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/modifier/update',
				async ({ body, auth }) => {
					const result = await modifierService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: ModifierGroupUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/modifier/remove',
				async ({ query, auth }) => {
					const result = await modifierService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)
	)
}
