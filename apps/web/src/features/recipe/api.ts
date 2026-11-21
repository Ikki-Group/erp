import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery } from '@/lib/api/index.ts'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@/lib/validation/index.ts'

import {
	HppResponseDto,
	RecipeCreateDto,
	RecipeDetailDto,
	RecipeDto,
	RecipeFilterDto,
	RecipeUpdateDto,
} from './dto/index.ts'

// ─── Cache keys ───
//
// Every recipe read lives under `all()` — list, enriched detail, by-menu-item and HPP —
// so a mutation can invalidate the whole family with one prefix. The CRUD sugar of
// `defineResource` only invalidates lists and one detail key, which would leave the
// by-menu-item and HPP reads stale, hence the explicit endpoints below.

const baseKeys = createResourceKeys('recipe', 'recipe')

const MenuItemQuery = z.object({ menuItemId: z.coerce.number().int().positive() })
const HppQuery = MenuItemQuery.extend({ locationId: z.coerce.number().int().positive() })

const keys = {
	...baseKeys,
	byMenuItem: (query?: { menuItemId: number }) =>
		[...baseKeys.all(), 'by-menu-item', query ?? null] as const,
	hpp: (query?: { menuItemId: number; locationId: number }) =>
		[...baseKeys.all(), 'hpp', query ?? null] as const,
}

// ─── Reads ───

const list = defineQuery({
	method: 'get',
	url: endpoint.recipe.list,
	query: RecipeFilterDto,
	result: createPaginatedResponseSchema(RecipeDto),
	queryKey: (query) => keys.list(query),
})

/** Enriched detail (lines with material name and UoM code), shared by every editor. */
const detail = defineQuery({
	method: 'get',
	url: endpoint.recipe.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(RecipeDetailDto),
	queryKey: (query) => keys.detail(query),
})

const byMenuItem = defineQuery({
	method: 'get',
	url: endpoint.recipe.byMenuItem,
	query: MenuItemQuery,
	result: createSuccessResponseSchema(RecipeDetailDto),
	queryKey: (query) => keys.byMenuItem(MenuItemQuery.parse(query)),
})

/** Cost of the menu item's ACTIVE recipe at a location — not of an arbitrary historical recipe. */
const hpp = defineQuery({
	method: 'get',
	url: endpoint.recipe.hpp,
	query: HppQuery,
	result: createSuccessResponseSchema(HppResponseDto),
	queryKey: (query) => keys.hpp(HppQuery.parse(query)),
})

// ─── Mutations ───

const entityRef = createSuccessResponseSchema(zc.RecordId)

const create = defineMutation({
	method: 'post',
	url: endpoint.recipe.create,
	body: RecipeCreateDto,
	result: entityRef,
	invalidates: [keys.all()],
})

const update = defineMutation({
	method: 'put',
	url: endpoint.recipe.update,
	body: RecipeUpdateDto,
	result: entityRef,
	invalidates: [keys.all()],
})

const remove = defineMutation({
	method: 'delete',
	url: endpoint.recipe.remove,
	query: zc.RecordId,
	result: entityRef,
	invalidates: [keys.all()],
})

export const recipeResource = { keys, list, detail, byMenuItem, hpp, create, update, remove }
