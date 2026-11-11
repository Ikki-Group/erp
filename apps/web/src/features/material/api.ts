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
	feature: 'material',
	resource: 'material',
	urls: endpoint.material,
	entitySchema: MaterialDto,
	filter: MaterialFilterDto,
	create: MaterialCreateDto,
	update: MaterialUpdateDto,
})

// ─── Category Resource (CRUD) ───

export const categoryResource = defineResource({
	feature: 'material',
	resource: 'category',
	urls: endpoint.material.category,
	entitySchema: MaterialCategoryDto,
	filter: MaterialCategoryFilterDto,
	create: MaterialCategoryCreateDto,
	update: MaterialCategoryUpdateDto,
})

// ─── Assignment Endpoints ───

const assignmentUrls = endpoint.material.assignment

const assignmentKeys = {
	byLocation: (locationId?: number) =>
		locationId === undefined
			? ([assignmentUrls.byLocation] as const)
			: ([assignmentUrls.byLocation, locationId] as const),
	byMaterial: (materialId?: number) =>
		materialId === undefined
			? ([assignmentUrls.byMaterial] as const)
			: ([assignmentUrls.byMaterial, materialId] as const),
}

const assignmentByLocation = defineQuery({
	method: 'get',
	url: assignmentUrls.byLocation,
	query: z.object({ locationId: z.coerce.number().int().positive() }),
	result: createSuccessResponseSchema(z.array(MaterialLocationDto)),
	queryKey: (args) =>
		assignmentKeys.byLocation(z.coerce.number().int().positive().parse(args.locationId)),
})

const assignmentByMaterial = defineQuery({
	method: 'get',
	url: assignmentUrls.byMaterial,
	query: z.object({ materialId: z.coerce.number().int().positive() }),
	result: createSuccessResponseSchema(z.array(MaterialLocationDto)),
	queryKey: (args) =>
		assignmentKeys.byMaterial(z.coerce.number().int().positive().parse(args.materialId)),
})

const assignmentAssign = defineMutation({
	method: 'post',
	url: assignmentUrls.assign,
	body: MaterialAssignDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [
		assignmentKeys.byLocation(),
		assignmentKeys.byMaterial(),
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
		assignmentKeys.byMaterial(),
		materialResource.keys.lists(),
	],
})

export const assignmentResource = {
	keys: assignmentKeys,
	byLocation: assignmentByLocation,
	byMaterial: assignmentByMaterial,
	assign: assignmentAssign,
	unassign: assignmentUnassign,
}
