import { zRes } from '@ikki/contract/http'
import { zc } from '@ikki/contract/schema'
import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { defineQuery, defineResource } from '@/lib/api/index.ts'

import {
	HppResponseDto,
	RecipeCreateDto,
	RecipeDetailDto,
	RecipeDto,
	RecipeFilterDto,
	RecipeUpdateDto,
} from './dto/index.ts'

// ─── Recipe Resource (CRUD) ───

export const recipeResource = defineResource({
	feature: 'recipe',
	resource: 'recipe',
	urls: endpoint.recipe,
	entitySchema: RecipeDto,
	filter: RecipeFilterDto,
	create: RecipeCreateDto,
	update: RecipeUpdateDto,
})

// ─── Recipe Detail (with lines) ───

const detailQuery = defineQuery({
	method: 'get',
	url: endpoint.recipe.detail,
	query: zc.RecordId,
	result: zRes.ok(RecipeDetailDto),
	// Distinct from `recipeResource.detail` (no lines) so the two shapes never share a cache entry.
	queryKey: (query) => [...recipeResource.keys.details(), 'withLines', query],
})

// ─── Recipe Detail by Menu Item ───

const byMenuItemQuery = defineQuery({
	method: 'get',
	url: endpoint.recipe.byMenuItem,
	query: z.object({ menuItemId: z.coerce.number().int().positive() }),
	result: zRes.ok(RecipeDetailDto),
	queryKey: (query) => [...recipeResource.keys.details(), 'byMenuItem', query],
})

// ─── HPP Calculation ───

const hppQuery = defineQuery({
	method: 'get',
	url: endpoint.recipe.hpp,
	query: z.object({
		menuItemId: z.coerce.number().int().positive(),
		locationId: z.coerce.number().int().positive(),
	}),
	queryKey: (query) => [...recipeResource.keys.all(), 'hpp', query],
	result: zRes.ok(HppResponseDto),
})

export const recipeExtras = {
	detail: detailQuery,
	byMenuItem: byMenuItemQuery,
	hpp: hppQuery,
}
