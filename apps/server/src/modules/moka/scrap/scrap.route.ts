import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import type { MokaScrapHistoryService } from './scrap-history.service'
import { MokaTriggerInputDto } from './scrap.contract'
import type { MokaScrapService } from './scrap.service'

export function initMokaScrapRoute(
	scrapSvc: MokaScrapService,
	historySvc: MokaScrapHistoryService,
) {
	return new Elysia({ prefix: '/scrap' })
		.use(authPluginMacro)
		.post(
			'/trigger',
			async function trigger(context) {
				const result = await scrapSvc.handleTrigger(context.body, context.auth.userId)
				return res.ok(result)
			},
			{ body: MokaTriggerInputDto, auth: true },
		)
		.get(
			'/history',
			async function history(context) {
				const result = await historySvc.handleList(context.query.mokaConfigurationId)
				return res.ok(result)
			},
			{ query: z.object({ mokaConfigurationId: z.coerce.number().optional() }), auth: true },
		)
}
