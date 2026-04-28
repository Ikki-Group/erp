import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zc, createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

import {
	AccountCreateDto,
	AccountDto,
	AccountFilterDto,
	AccountUpdateDto,
} from '../dto/account.dto'
import { JournalEntryFilterDto, JournalEntryWithItemsDto } from '../dto/journal.dto'

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
		params: zc.RecordId,
		result: createSuccessResponseSchema(AccountDto),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.finance.account.create,
		body: AccountCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.finance.account.list],
	}),
	update: apiFactory({
		method: 'patch',
		url: endpoint.finance.account.update,
		body: AccountUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.finance.account.list, endpoint.finance.account.detail],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.finance.account.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.finance.account.list],
	}),
}

export const generalLedgerApi = {
	entries: apiFactory({
		method: 'get',
		url: endpoint.finance.journal.entries,
		params: JournalEntryFilterDto,
		result: createSuccessResponseSchema(z.array(JournalEntryWithItemsDto)),
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.finance.journal.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(JournalEntryWithItemsDto),
	}),
}
