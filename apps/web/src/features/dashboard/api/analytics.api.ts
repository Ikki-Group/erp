import { z } from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@/lib/zod'

import { PnLRequestDto, TopSalesRequestDto } from '../dto/analytics.dto'

export const analyticsApi = {
	pnl: apiFactory({
		method: 'post',
		url: endpoint.dashboard.analytics.pnl,
		body: PnLRequestDto,
		result: createSuccessResponseSchema(z.any()),
	}),
	topSales: apiFactory({
		method: 'post',
		url: endpoint.dashboard.analytics.topSales,
		body: TopSalesRequestDto,
		result: createSuccessResponseSchema(z.any()),
	}),
}
