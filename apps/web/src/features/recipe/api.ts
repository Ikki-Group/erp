import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { defineQuery, defineResource } from '@/lib/api/index.ts'
import { createSuccessResponseSchema, zc } from '@/lib/validation/index.ts'

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
	result: createSuccessResponseSchema(RecipeDetailDto),
	queryKey: (query) => [endpoint.recipe.detail, query ?? null],
})

// ─── Recipe Detail by Menu Item ───

const byMenuItemQuery = defineQuery({
	method: 'get',
	url: endpoint.recipe.byMenuItem,
	query: z.object({ menuItemId: z.coerce.number().int().positive() }),
	result: createSuccessResponseSchema(RecipeDetailDto),
	queryKey: (query) => [endpoint.recipe.byMenuItem, query?.menuItemId ?? null],
})

// ─── HPP Calculation ───

const hppQuery = defineQuery({
	method: 'get',
	url: endpoint.recipe.hpp,
	query: z.object({
		menuItemId: z.coerce.number().int().positive(),
		locationId: z.coerce.number().int().positive(),
	}),
	queryKey: (query) => [endpoint.recipe.hpp, query ?? null],
	result: createSuccessResponseSchema(HppResponseDto),
})

export const recipeExtras = {
	detail: detailQuery,
	byMenuItem: byMenuItemQuery,
	hpp: hppQuery,
}
