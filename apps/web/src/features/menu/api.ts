import { zRes } from '@ikki/contract/http'
import { zc } from '@ikki/contract/schema'

import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'

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
	result: zRes.ok(MenuItemDetailDto),
	// Distinct from `menuItemResource.detail` (plain MenuItemDto) so the two shapes never share a cache entry.
	queryKey: (query) => [...menuItemResource.keys.details(), 'composed', query],
})

// ─── Menu Item Modifier Sync ───

const modifierSyncMutation = defineMutation({
	method: 'post',
	url: endpoint.menu.item.modifiersSync,
	body: MenuItemModifierSyncDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [menuItemResource.keys.root()],
})

export const menuItemExtras = {
	detail: itemDetailQuery,
	modifiersSync: modifierSyncMutation,
}

// ─── Menu Category Resource ───

const categoryUrls = endpoint.menu.category

const categoryKeys = createResourceKeys('menu', 'category')

const categoryList = defineQuery({
	method: 'get',
	url: categoryUrls.list,
	query: MenuCategoryFilterDto,
	result: zRes.paginated(MenuCategoryDto),
	queryKey: (query) => categoryKeys.list(query),
})

const categoryCreate = defineMutation({
	method: 'post',
	url: categoryUrls.create,
	body: MenuCategoryCreateDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [categoryKeys.root(), menuItemResource.keys.root()],
})

const categoryUpdate = defineMutation({
	method: 'put',
	url: categoryUrls.update,
	body: MenuCategoryUpdateDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [categoryKeys.root(), menuItemResource.keys.root()],
})

const categoryRemove = defineMutation({
	method: 'delete',
	url: categoryUrls.remove,
	query: zc.RecordId,
	result: zRes.ok(zc.RecordId),
	invalidates: [categoryKeys.root(), menuItemResource.keys.root()],
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
	feature: 'menu',
	resource: 'modifier',
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
	result: zRes.ok(ModifierGroupWithOptionsDto),
	// Distinct from `modifierGroupResource.detail` (no options) so the two shapes never share a cache entry.
	queryKey: (query) => [...modifierGroupResource.keys.details(), 'withOptions', query],
})

export const modifierGroupExtras = {
	detail: modifierDetailQuery,
}
