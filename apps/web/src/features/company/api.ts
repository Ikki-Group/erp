import { zRes } from '@ikki/contract/http'
import { zc } from '@ikki/contract/schema'

import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery } from '@/lib/api/index.ts'

import { CompanySettingsDto, CompanySettingsUpdateDto } from './dto/index.ts'

const keys = {
	detail: () => [endpoint.company.settings] as const,
}

// Company settings is a singleton (seeded). The server exposes GET/PUT
// /company/settings — there is no create route.
export const companyDetail = defineQuery({
	method: 'get',
	url: endpoint.company.settings,
	result: zRes.ok(CompanySettingsDto),
	queryKey: () => [...keys.detail()],
})

export const companyUpdate = defineMutation({
	method: 'put',
	url: endpoint.company.settings,
	body: CompanySettingsUpdateDto,
	result: zRes.ok(zc.RecordId),
	invalidates: [keys.detail()],
})
