import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'
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
	queryKey: (query) => [endpoint.menu.item.detail, query ?? null],
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
	invalidates: [categoryKeys.lists(), menuItemResource.keys.lists()],
})

const categoryUpdate = defineMutation({
	method: 'put',
	url: categoryUrls.update,
	body: MenuCategoryUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [categoryKeys.lists(), menuItemResource.keys.lists()],
})

const categoryRemove = defineMutation({
	method: 'delete',
	url: categoryUrls.remove,
	query: zc.RecordId,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [categoryKeys.lists(), menuItemResource.keys.lists()],
})

export const menuCategoryResource = {
	keys: categoryKeys,
	list: categoryList,
	create: categoryCreate,
	update: categoryUpdate,
	remove: categoryRemove,
}

// ─── Modifier Group Resource ───

export const modifierGroupResource = defineResource({
	urls: endpoint.menu.modifier,
	entitySchema: ModifierGroupDto,
	filter: ModifierGroupFilterDto,
	create: ModifierGroupCreateDto,
	update: ModifierGroupUpdateDto,
})

// ─── Modifier Group Detail (with options) ───

const modifierDetailQuery = defineQuery({
	method: 'get',
	url: endpoint.menu.modifier.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(ModifierGroupWithOptionsDto),
	queryKey: (query) => [endpoint.menu.modifier.detail, query ?? null],
})

export const modifierGroupExtras = {
	detail: modifierDetailQuery,
}
