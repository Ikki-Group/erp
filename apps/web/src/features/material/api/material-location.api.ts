import z from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zc, zq, createSuccessResponseSchema, createPaginatedResponseSchema } from '@/lib/validation'

import {
	MaterialLocationAssignDto,
	MaterialLocationConfigDto,
	MaterialLocationFilterDto,
	MaterialLocationStockDto,
	MaterialLocationUnassignDto,
	MaterialLocationWithLocationDto,
} from '../dto'

export const materialLocationApi = {
	/** Paginated stock list for a specific location */
	stock: apiFactory({
		method: 'get',
		url: endpoint.material.location.stock,
		params: z.object({ ...zq.pagination.shape, ...MaterialLocationFilterDto.shape }),
		result: createPaginatedResponseSchema(MaterialLocationStockDto),
	}),

	/** Assign materials to a location (batch) */
	assign: apiFactory({
		method: 'post',
		url: endpoint.material.location.assign,
		body: MaterialLocationAssignDto,
		result: createSuccessResponseSchema(z.object({ assignedCount: z.number() })),
		invalidates: [endpoint.material.location.stock, endpoint.material.location.byMaterial],
	}),

	/** Unassign a material from a location */
	unassign: apiFactory({
		method: 'delete',
		url: endpoint.material.location.unassign,
		params: MaterialLocationUnassignDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.location.stock, endpoint.material.location.byMaterial],
	}),

	/** List locations assigned to a material */
	byMaterial: apiFactory({
		method: 'get',
		url: endpoint.material.location.byMaterial,
		params: zc.RecordId,
		result: createSuccessResponseSchema(MaterialLocationWithLocationDto.array()),
	}),

	/** Update per-location config */
	updateConfig: apiFactory({
		method: 'put',
		url: endpoint.material.location.config,
		body: MaterialLocationConfigDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.material.location.stock, endpoint.material.location.byMaterial],
	}),
}
