import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'
import { defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'
import { createSuccessResponseSchema, zc } from '@/lib/validation/index.ts'

import {
	MaterialAssignDto,
	MaterialCategoryCreateDto,
	MaterialCategoryDto,
	MaterialCategoryFilterDto,
	MaterialCategoryUpdateDto,
	MaterialCreateDto,
	MaterialDto,
	MaterialFilterDto,
	MaterialLocationDto,
	MaterialUpdateDto,
} from './dto/index.ts'

// ─── Material Resource (CRUD) ───

export const materialResource = defineResource({
	urls: endpoint.material,
	entitySchema: MaterialDto,
	filter: MaterialFilterDto,
	create: MaterialCreateDto,
	update: MaterialUpdateDto,
})

// ─── Category Resource (CRUD) ───

export const categoryResource = defineResource({
	urls: endpoint.material.category,
	entitySchema: MaterialCategoryDto,
	filter: MaterialCategoryFilterDto,
	create: MaterialCategoryCreateDto,
	update: MaterialCategoryUpdateDto,
})

// ─── Assignment Endpoints ───

const assignmentUrls = endpoint.material.assignment

const assignmentKeys = {
	byLocation: (locationId?: number) => [assignmentUrls.byLocation, locationId ?? null] as const,
}

const assignmentByLocation = defineQuery({
	method: 'get',
	url: assignmentUrls.byLocation,
	query: z.object({ locationId: z.coerce.number().int().positive() }),
	result: createSuccessResponseSchema(z.array(MaterialLocationDto)),
	queryKey: (args) => [assignmentUrls.byLocation, args?.locationId ?? null],
})

const assignmentAssign = defineMutation({
	method: 'post',
	url: assignmentUrls.assign,
	body: MaterialAssignDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [
		assignmentKeys.byLocation(),
		materialResource.keys.lists(),
	],
})

const assignmentUnassign = defineMutation({
	method: 'post',
	url: assignmentUrls.unassign,
	body: MaterialAssignDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [
		assignmentKeys.byLocation(),
		materialResource.keys.lists(),
	],
})

export const assignmentResource = {
	keys: assignmentKeys,
	byLocation: assignmentByLocation,
	assign: assignmentAssign,
	unassign: assignmentUnassign,
}
