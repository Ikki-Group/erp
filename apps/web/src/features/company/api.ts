import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery } from '@/lib/api/index.ts'
import { createSuccessResponseSchema, zc } from '@/lib/validation/index.ts'

import {
	CompanySettingsCreateDto,
	CompanySettingsDto,
	CompanySettingsUpdateDto,
} from './dto/index.ts'

const keys = {
	detail: () => [endpoint.company.detail] as const,
}

export const companyDetail = defineQuery({
	method: 'get',
	url: endpoint.company.detail,
	result: createSuccessResponseSchema(CompanySettingsDto),
	queryKey: () => [...keys.detail()],
})

export const companyCreate = defineMutation({
	method: 'post',
	url: endpoint.company.create,
	body: CompanySettingsCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [keys.detail()],
})

export const companyUpdate = defineMutation({
	method: 'patch',
	url: endpoint.company.update,
	body: CompanySettingsUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [keys.detail()],
})
