import { endpoint } from '@/config/endpoint'

import { apiFactory, createQueryKeys } from '@/lib/api'
import { createSuccessResponseSchema, zc } from '@/lib/validation'

import { CompanySettingsDto, CompanySettingsCreateDto, CompanySettingsUpdateDto } from '../dto'

const companySettingsKeys = createQueryKeys('company', 'settings')

export const companySettingsApi = {
	get: apiFactory({
		method: 'get',
		url: endpoint.company.settings.get,
		result: createSuccessResponseSchema(CompanySettingsDto),
		queryKey: () => companySettingsKeys.detail('current'),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.company.settings.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(CompanySettingsDto),
		queryKey: (params) => companySettingsKeys.detail(params?.id),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.company.settings.create,
		body: CompanySettingsCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [companySettingsKeys.all()],
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.company.settings.update,
		body: CompanySettingsUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [companySettingsKeys.all(), ({ body }) => companySettingsKeys.detail(body.id)],
	}),
}
