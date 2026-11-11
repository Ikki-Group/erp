import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zc, createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

import { ExpenditureCreateDto, ExpenditureDto, ExpenditureFilterDto } from '../dto/expenditure.dto'

export const expenditureApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.finance.expenditure.list,
		params: ExpenditureFilterDto,
		result: createPaginatedResponseSchema(ExpenditureDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.finance.expenditure.create,
		body: ExpenditureCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.finance.expenditure.list],
	}),
}
