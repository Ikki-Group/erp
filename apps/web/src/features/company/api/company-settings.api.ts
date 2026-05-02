import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@/lib/validation'

import { CompanySettingsDto, CompanySettingsCreateDto, CompanySettingsUpdateDto } from '../dto'

export const companySettingsApi = {
	get: apiFactory({
		method: 'get',
		url: endpoint.company.settings.get,
		result: createSuccessResponseSchema(CompanySettingsDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.company.settings.detail,
		params: zc.recordId,
		result: createSuccessResponseSchema(CompanySettingsDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.company.settings.create,
		body: CompanySettingsCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.company.settings.update,
		body: CompanySettingsUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
	}),
}
