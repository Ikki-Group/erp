import { Elysia } from 'elysia'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
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
				{
					query: MenuCategoryFilterDto,
					response: zRes.paginated(MenuCategoryDto),
					permission: 'category.read',
				},
			)
			.post(
				'/category/create',
				async ({ body, auth }) => {
					const result = await categoryService.handleCreate(body, actorOf(auth))
					return res.created(result)
				},
				{
					body: MenuCategoryCreateDto,
					response: zRes.created(EntityRefDto),
					permission: 'category.create',
				},
			)
			.put(
				'/category/update',
				async ({ body, auth }) => {
					const result = await categoryService.handleUpdate(body, actorOf(auth))
					return res.ok(result)
				},
				{
					body: MenuCategoryUpdateDto,
					response: zRes.ok(EntityRefDto),
					permission: 'category.update',
				},
			)
			.delete(
				'/category/remove',
				async ({ query, auth }) => {
					const result = await categoryService.handleDelete(query.id, actorOf(auth))
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto), permission: 'category.delete' },
			)

			// ─── Menu Item Routes ───

			.get(
				'/item/list',
				async ({ query }) => {
					const result = await itemService.handleList(query)
					return res.paginated(result)
				},
				{
					query: MenuItemFilterDto,
					response: zRes.paginated(MenuItemDto),
					permission: 'item.read',
				},
			)
			.get(
				'/item/detail',
				async ({ query }) => {
					const result = await composedService.handleDetail(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(MenuItemDetailDto), permission: 'item.read' },
			)
			.post(
				'/item/create',
				async ({ body, auth }) => {
					const result = await itemService.handleCreate(body, actorOf(auth))
					return res.created(result)
				},
				{
					body: MenuItemCreateDto,
					response: zRes.created(EntityRefDto),
					permission: 'item.create',
				},
			)
			.put(
				'/item/update',
				async ({ body, auth }) => {
					const result = await itemService.handleUpdate(body, actorOf(auth))
					return res.ok(result)
				},
				{ body: MenuItemUpdateDto, response: zRes.ok(EntityRefDto), permission: 'item.update' },
			)
			.delete(
				'/item/remove',
				async ({ query, auth }) => {
					const result = await itemService.handleDelete(query.id, actorOf(auth))
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto), permission: 'item.delete' },
			)

			// ─── Item Modifier Assignment ───

			.post(
				'/item/modifiers/sync',
				async ({ body, auth }) => {
					const result = await assignmentService.handleSync(body, actorOf(auth))
					return res.ok(result)
				},
				{
					body: MenuItemModifierSyncDto,
					response: zRes.ok(EntityRefDto),
					permission: 'item.update',
				},
			)

			// ─── Modifier Group Routes ───

			.get(
				'/modifier/list',
				async ({ query }) => {
					const result = await modifierService.handleList(query)
					return res.paginated(result)
				},
				{
					query: ModifierGroupFilterDto,
					response: zRes.paginated(ModifierGroupDto),
					permission: 'modifier.read',
				},
			)
			.get(
				'/modifier/detail',
				async ({ query }) => {
					const result = await modifierService.handleDetail(query.id)
					return res.ok(result)
				},
				{
					query: zq.recordId,
					response: zRes.ok(ModifierGroupWithOptionsDto),
					permission: 'modifier.read',
				},
			)
			.post(
				'/modifier/create',
				async ({ body, auth }) => {
					const result = await modifierService.handleCreate(body, actorOf(auth))
					return res.created(result)
				},
				{
					body: ModifierGroupCreateDto,
					response: zRes.created(EntityRefDto),
					permission: 'modifier.create',
				},
			)
			.put(
				'/modifier/update',
				async ({ body, auth }) => {
					const result = await modifierService.handleUpdate(body, actorOf(auth))
					return res.ok(result)
				},
				{
					body: ModifierGroupUpdateDto,
					response: zRes.ok(EntityRefDto),
					permission: 'modifier.update',
				},
			)
			.delete(
				'/modifier/remove',
				async ({ query, auth }) => {
					const result = await modifierService.handleDelete(query.id, actorOf(auth))
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto), permission: 'modifier.delete' },
			)
	)
}
