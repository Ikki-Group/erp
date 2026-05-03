import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import type { GeneralLedgerService } from './general-ledger.service'
import { createSuccessResponseSchema } from '@/lib/validation'

const GetEntryQuery = z.object({
	sourceType: z.string(),
	sourceId: z.coerce.number(),
})

export function initGeneralLedgerRoute(s: GeneralLedgerService) {
	return new Elysia({ prefix: '/general-ledger' }).use(authPluginMacro).get(
		'/entry',
		async ({ query }) => {
			const entry = await s.getEntryBySource(query.sourceType, query.sourceId)
			return res.ok(entry)
		},
		{
			query: GetEntryQuery,
			response: createSuccessResponseSchema(z.any()),
			auth: true,
		},
	)
}
