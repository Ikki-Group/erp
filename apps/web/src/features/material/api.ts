import { zRes } from '@ikki/contract/http'
import { zc } from '@ikki/contract/schema'
import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'

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

const assignmentKeys = createResourceKeys('material', 'assignment')

const assignmentByLocation = defineQuery({
	method: 'get',
	url: assignmentUrls.byLocation,
	query: z.object({ locationId: z.coerce.number().int().positive() }),
	result: zRes.ok(z.array(MaterialLocationDto)),
	queryKey: (args) => assignmentKeys.list({ locationId: args.locationId }),
})

const assignmentByMaterial = defineQuery({
	method: 'get',
	url: assignmentUrls.byMaterial,
	query: z.object({ materialId: z.coerce.number().int().positive() }),
	result: zRes.ok(z.array(MaterialLocationDto)),
	queryKey: (args) => assignmentKeys.list({ materialId: args.materialId }),
})

const assignmentAssign = defineMutation({
	method: 'post',
	url: assignmentUrls.assign,
	body: MaterialAssignDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [assignmentKeys.root(), materialResource.keys.root()],
})

const assignmentUnassign = defineMutation({
	method: 'post',
	url: assignmentUrls.unassign,
	body: MaterialAssignDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [assignmentKeys.root(), materialResource.keys.root()],
})

export const assignmentResource = {
	keys: assignmentKeys,
	byLocation: assignmentByLocation,
	byMaterial: assignmentByMaterial,
	assign: assignmentAssign,
	unassign: assignmentUnassign,
}
