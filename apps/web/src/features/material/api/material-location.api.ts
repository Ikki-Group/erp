import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import {
	zPaginationDto,
	zRecordIdDto,
	createSuccessResponseSchema,
	createPaginatedResponseSchema,
} from '@/lib/zod'

import {
	MaterialLocationAssignDto,
	MaterialLocationConfigDto,
	MaterialLocationFilterDto,
	MaterialLocationStockDto,
	MaterialLocationUnassignDto,
	MaterialLocationWithLocationDto,
} from '../dto'

import z from 'zod'

export const materialLocationApi = {
	/** Paginated stock list for a specific location */
	stock: apiFactory({
		method: 'get',
		url: endpoint.material.location.stock,
		params: z.object({ ...zPaginationDto.shape, ...MaterialLocationFilterDto.shape }),
		result: createPaginatedResponseSchema(MaterialLocationStockDto),
	}),

	/** Assign materials to a location (batch) */
	assign: apiFactory({
		method: 'post',
		url: endpoint.material.location.assign,
		body: MaterialLocationAssignDto,
		result: createSuccessResponseSchema(z.object({ assignedCount: z.number() })),
	}),

	/** Unassign a material from a location */
	unassign: apiFactory({
		method: 'delete',
		url: endpoint.material.location.unassign,
		params: MaterialLocationUnassignDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),

	/** List locations assigned to a material */
	byMaterial: apiFactory({
		method: 'get',
		url: endpoint.material.location.byMaterial,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(MaterialLocationWithLocationDto.array()),
	}),

	/** Update per-location config */
	updateConfig: apiFactory({
		method: 'put',
		url: endpoint.material.location.config,
		body: MaterialLocationConfigDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}
