import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@/lib/validation'

import {
	PnLDataDto,
	PnLRequestDto,
	TopSalesItemDto,
	TopSalesRequestDto,
} from '../dto/analytics.dto'

export const analyticsApi = {
	pnl: apiFactory({
		method: 'post',
		url: endpoint.dashboard.analytics.pnl,
		body: PnLRequestDto,
		result: createSuccessResponseSchema(PnLDataDto),
	}),
	topSales: apiFactory({
		method: 'post',
		url: endpoint.dashboard.analytics.topSales,
		body: TopSalesRequestDto,
		result: createSuccessResponseSchema(z.array(TopSalesItemDto)),
	}),
}
