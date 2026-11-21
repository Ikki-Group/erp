import { Elysia } from 'elysia'

import { crudRoutes } from '@/server/crud-route.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

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
	return new Elysia({ prefix: '/menu' })
		.use(rbac.as('scoped'))
		.use(
			crudRoutes({
				prefix: '/category',
				resource: 'category',
				tag: 'Menu Categories',
				entity: 'menu category',
				schemas: {
					filter: MenuCategoryFilterDto,
					dto: MenuCategoryDto,
					create: MenuCategoryCreateDto,
					update: MenuCategoryUpdateDto,
				},
				service: categoryService,
				detail: false,
			}),
		)
		.use(
			crudRoutes({
				prefix: '/item',
				resource: 'item',
				tag: 'Menu Items',
				entity: 'menu item',
				schemas: {
					filter: MenuItemFilterDto,
					dto: MenuItemDto,
					create: MenuItemCreateDto,
					update: MenuItemUpdateDto,
				},
				service: itemService,
				detail: {
					response: MenuItemDetailDto,
					handle: (id, actor) => composedService.handleDetail(id, actor),
				},
			}),
		)
		.post(
			'/item/modifiers/sync',
			async ({ body, actor }) => res.ok(await assignmentService.handleSync(body, actor)),
			{
				body: MenuItemModifierSyncDto,
				response: zRes.ok(EntityRefDto),
				permission: 'item.update',
				detail: {
					tags: ['Menu Items'],
					summary: 'Replace item modifier groups',
					description:
						"Replaces the menu item's whole modifier-group set with the given groups. Every group must belong to the item's location.",
				},
			},
		)
		.use(
			crudRoutes({
				prefix: '/modifier',
				resource: 'modifier',
				tag: 'Modifier Groups',
				entity: 'modifier group',
				schemas: {
					filter: ModifierGroupFilterDto,
					dto: ModifierGroupDto,
					create: ModifierGroupCreateDto,
					update: ModifierGroupUpdateDto,
				},
				service: modifierService,
				detail: {
					response: ModifierGroupWithOptionsDto,
					handle: (id, actor) => modifierService.handleDetail(id, actor),
				},
			}),
		)
}
