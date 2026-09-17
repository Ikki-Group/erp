import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery } from '@/lib/api/index.ts'
import { createSuccessResponseSchema, zc } from '@/lib/validation/index.ts'

import { CompanySettingsDto, CompanySettingsUpdateDto } from './dto/index.ts'

const keys = {
	detail: () => [endpoint.company.settings] as const,
}

// Company settings is a singleton (seeded). The server exposes GET/PUT
// /company/settings — there is no create route.
export const companyDetail = defineQuery({
	method: 'get',
	url: endpoint.company.settings,
	result: createSuccessResponseSchema(CompanySettingsDto),
	queryKey: () => [...keys.detail()],
})

export const companyUpdate = defineMutation({
	method: 'put',
	url: endpoint.company.settings,
	body: CompanySettingsUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [keys.detail()],
})
