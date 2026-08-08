import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'
import { zq } from '@/shared/schema/index.ts'

import { MenuItemModifierSyncDto } from './assignment/assignment.contract.ts'
import type { AssignmentService } from './assignment/assignment.service.ts'
import {
	MenuCategoryCreateDto,
	MenuCategoryFilterDto,
	MenuCategoryUpdateDto,
} from './category/category.contract.ts'
import type { CategoryService } from './category/category.service.ts'
import type { ComposedService } from './composed/composed.service.ts'
import { MenuItemCreateDto, MenuItemFilterDto, MenuItemUpdateDto } from './item/item.contract.ts'
import type { ItemService } from './item/item.service.ts'
import {
	ModifierGroupCreateDto,
	ModifierGroupFilterDto,
	ModifierGroupUpdateDto,
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
		new Elysia({ prefix: '/menu' })
			.use(authPluginMacro)

			// ─── Category Routes ───

			.get(
				'/category/list',
				async ({ query }) => {
					const result = await categoryService.handleList(query)
					return res.paginated(result)
				},
				{ query: MenuCategoryFilterDto },
			)
			.post(
				'/category/create',
				async ({ body, auth }) => {
					const result = await categoryService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: MenuCategoryCreateDto },
			)
			.put(
				'/category/update',
				async ({ body, auth }) => {
					const result = await categoryService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: MenuCategoryUpdateDto },
			)
			.delete(
				'/category/remove',
				async ({ query, auth }) => {
					const result = await categoryService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)

			// ─── Menu Item Routes ───

			.get(
				'/item/list',
				async ({ query }) => {
					const result = await itemService.handleList(query)
					return res.paginated(result)
				},
				{ query: MenuItemFilterDto },
			)
			.get(
				'/item/detail',
				async ({ query }) => {
					const result = await composedService.handleDetail(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)
			.post(
				'/item/create',
				async ({ body, auth }) => {
					const result = await itemService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: MenuItemCreateDto },
			)
			.put(
				'/item/update',
				async ({ body, auth }) => {
					const result = await itemService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: MenuItemUpdateDto },
			)
			.delete(
				'/item/remove',
				async ({ query, auth }) => {
					const result = await itemService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)

			// ─── Item Modifier Assignment ───

			.post(
				'/item/modifiers/sync',
				async ({ body, auth }) => {
					const result = await assignmentService.handleSync(body, auth.userId)
					return res.ok(result)
				},
				{ body: MenuItemModifierSyncDto },
			)

			// ─── Modifier Group Routes ───

			.get(
				'/modifier/list',
				async ({ query }) => {
					const result = await modifierService.handleList(query)
					return res.paginated(result)
				},
				{ query: ModifierGroupFilterDto },
			)
			.get(
				'/modifier/detail',
				async ({ query }) => {
					const result = await modifierService.handleDetail(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)
			.post(
				'/modifier/create',
				async ({ body, auth }) => {
					const result = await modifierService.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: ModifierGroupCreateDto },
			)
			.put(
				'/modifier/update',
				async ({ body, auth }) => {
					const result = await modifierService.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: ModifierGroupUpdateDto },
			)
			.delete(
				'/modifier/remove',
				async ({ query, auth }) => {
					const result = await modifierService.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId },
			)
	)
}
