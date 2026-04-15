import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zRecordIdDto } from '@/lib/zod'

import {
	AccountCreateDto,
	AccountDto,
	AccountFilterDto,
	AccountUpdateDto,
} from '../dto/account.dto'

export const accountApi = {
	list: apiFactory({
		method: 'get',
		url: endpoint.finance.account.list,
		params: AccountFilterDto,
		result: createPaginatedResponseSchema(AccountDto),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.finance.account.detail,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(AccountDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.finance.account.create,
		body: AccountCreateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.finance.account.update,
		body: AccountUpdateDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.finance.account.remove,
		params: zRecordIdDto,
		result: createSuccessResponseSchema(zRecordIdDto),
	}),
}

export const journalApi = {
	entries: apiFactory({
		method: 'get',
		url: endpoint.finance.journal.entries,
		result: createSuccessResponseSchema(z.array(z.any())),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.finance.journal.detail,
		params: z.object({ id: z.number() }),
		result: createSuccessResponseSchema(z.any()),
	}),
}
