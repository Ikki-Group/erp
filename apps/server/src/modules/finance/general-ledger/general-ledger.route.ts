import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto, zc } from '@/shared/schema'

import { JournalEntryCreateDto, JournalEntryWithItemsDto } from './general-ledger.contract'
import type { GeneralLedgerModule } from './general-ledger.module'

const GetEntryQuery = zc.RecordId.extend({
	sourceType: JournalEntryWithItemsDto.shape.sourceType,
})

export function createGeneralLedgerRoute(m: GeneralLedgerModule) {
	return new Elysia({ prefix: '/general-ledger' })
		.use(authPluginMacro)
		.get(
			'/entry',
			async ({ query }) => {
				const result = await m.handleGetBySource(query.sourceType, query.id)
				return res.ok(result)
			},
			{
				query: GetEntryQuery,
				response: createSuccessResponseDto(JournalEntryWithItemsDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await m.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: JournalEntryCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
