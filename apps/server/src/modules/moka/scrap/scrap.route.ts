import { z } from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import type { MokaScrapHistoryService } from './scrap-history.service'
import { MokaTriggerInputDto } from './scrap.dto'
import type { MokaScrapService } from './scrap.service'

export function initMokaScrapRoute(
	scrapSvc: MokaScrapService,
	historySvc: MokaScrapHistoryService,
) {
	return new Elysia({ prefix: '/scrap' })
		.use(authPluginMacro)
		.post(
			'/trigger',
			async function trigger({ body, auth }) {
				const result = await scrapSvc.handleTrigger(body, auth.userId)
				return res.ok(result)
			},
			{ body: MokaTriggerInputDto, auth: true },
		)
		.get(
			'/history',
			async function history({ query }) {
				const result = await historySvc.handleList(query.mokaConfigurationId)
				return res.ok(result)
			},
			{ query: z.object({ mokaConfigurationId: z.coerce.number().optional() }), auth: true },
		)
}
