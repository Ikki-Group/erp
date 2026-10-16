import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@/lib/validation/index.ts'

import {
	MenuCategoryCreateDto,
	MenuCategoryDto,
	MenuCategoryFilterDto,
	MenuCategoryUpdateDto,
	MenuItemCreateDto,
	MenuItemDetailDto,
	MenuItemDto,
	MenuItemFilterDto,
	MenuItemModifierSyncDto,
	MenuItemUpdateDto,
	ModifierGroupCreateDto,
	ModifierGroupDto,
	ModifierGroupFilterDto,
	ModifierGroupUpdateDto,
	ModifierGroupWithOptionsDto,
} from './dto/index.ts'

// ─── Menu Item Resource ───

export const menuItemResource = defineResource({
	feature: 'menu',
	resource: 'item',
	urls: endpoint.menu.item,
	entitySchema: MenuItemDto,
	filter: MenuItemFilterDto,
	create: MenuItemCreateDto,
	update: MenuItemUpdateDto,
})

// ─── Menu Item Detail (composed with category + modifiers) ───

const itemDetailQuery = defineQuery({
	method: 'get',
	url: endpoint.menu.item.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(MenuItemDetailDto),
	// Composed shape differs from the entity detail, so it extends that key: item saves still
	// invalidate it, while the two responses never share one cache entry.
	queryKey: (query) => [...menuItemResource.keys.detail(query), 'composed'],
})

// ─── Menu Item Modifier Sync ───

const modifierSyncMutation = defineMutation({
	method: 'post',
	url: endpoint.menu.item.modifiersSync,
	body: MenuItemModifierSyncDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [menuItemResource.keys.lists(), menuItemResource.keys.details()],
})

export const menuItemExtras = {
	detail: itemDetailQuery,
	modifiersSync: modifierSyncMutation,
}

// ─── Menu Category Resource ───

const categoryUrls = endpoint.menu.category

const categoryKeys = {
	lists: () => [categoryUrls.list] as const,
	list: (query?: unknown) => [categoryUrls.list, query ?? null] as const,
}

const categoryList = defineQuery({
	method: 'get',
	url: categoryUrls.list,
	query: MenuCategoryFilterDto,
	result: createPaginatedResponseSchema(MenuCategoryDto),
	queryKey: (query) => categoryKeys.list(query),
})

const categoryCreate = defineMutation({
	method: 'post',
	url: categoryUrls.create,
	body: MenuCategoryCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [
		categoryKeys.lists(),
		menuItemResource.keys.lists(),
		menuItemResource.keys.details(),
	],
})

const categoryUpdate = defineMutation({
	method: 'put',
	url: categoryUrls.update,
	body: MenuCategoryUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [
		categoryKeys.lists(),
		menuItemResource.keys.lists(),
		menuItemResource.keys.details(),
	],
})

const categoryRemove = defineMutation({
	method: 'delete',
	url: categoryUrls.remove,
	query: zc.RecordId,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [
		categoryKeys.lists(),
		menuItemResource.keys.lists(),
		menuItemResource.keys.details(),
	],
})

export const menuCategoryResource = {
	keys: categoryKeys,
	list: categoryList,
	create: categoryCreate,
	update: categoryUpdate,
	remove: categoryRemove,
}

// ─── Modifier Group Resource ───

const modifierKeys = createResourceKeys('menu', 'modifier')
const modifierList = defineQuery({
	method: 'get',
	url: endpoint.menu.modifier.list,
	query: ModifierGroupFilterDto,
	result: createPaginatedResponseSchema(ModifierGroupDto),
	queryKey: (query) => modifierKeys.list(query),
})

const modifierDetail = defineQuery({
	method: 'get',
	url: endpoint.menu.modifier.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(ModifierGroupWithOptionsDto),
	queryKey: (query) => modifierKeys.detail(query),
})

// Group/options mutations affect enriched item readers as well as modifier lists and detail.
const modifierInvalidates = [modifierKeys.all(), menuItemResource.keys.details()]
const modifierCreate = defineMutation({
	method: 'post',
	url: endpoint.menu.modifier.create,
	body: ModifierGroupCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: modifierInvalidates,
})
const modifierUpdate = defineMutation({
	method: 'put',
	url: endpoint.menu.modifier.update,
	body: ModifierGroupUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: modifierInvalidates,
})
const modifierRemove = defineMutation({
	method: 'delete',
	url: endpoint.menu.modifier.remove,
	query: zc.RecordId,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: modifierInvalidates,
})

export const modifierGroupResource = {
	keys: modifierKeys,
	list: modifierList,
	detail: modifierDetail,
	create: modifierCreate,
	update: modifierUpdate,
	remove: modifierRemove,
}
