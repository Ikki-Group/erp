import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema, zRecordIdDto } from '@/lib/zod'

import { ExpenditureCreateDto, ExpenditureDto, ExpenditureFilterDto } from '../dto/expenditure.dto'

export const expenditureApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.finance.expenditure.list,
		params: ExpenditureFilterDto,
		result: createSuccessResponseSchema(z.array(ExpenditureDto)), // Service returns array currently
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.finance.expenditure.create,
		body: ExpenditureCreateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
		invalidates: [endpoint.finance.expenditure.list],
	}),
}
