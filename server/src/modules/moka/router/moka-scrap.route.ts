import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-plugin'
import { res } from '@/core/http/response'

import { MokaTriggerInputDto } from '../dto'
import type { MokaScrapHistoryService } from '../service/moka-scrap-history.service'
import type { MokaScrapService } from '../service/moka-scrap.service'

export function initMokaScrapRoute(scrapSvc: MokaScrapService, historySvc: MokaScrapHistoryService) {
  return new Elysia({ prefix: '/scrap' })
    .use(authPluginMacro)
    .post(
      '/trigger',
      async ({ body, auth }) => {
        const result = await scrapSvc.handleTrigger(body, auth.userId)
        return res.ok(result)
      },
      {
        body: MokaTriggerInputDto,
        auth: true,
      }
    )
    .get(
      '/history',
      async ({ query }) => {
        const result = await historySvc.handleList(
          query.mokaConfigurationId ? Number(query.mokaConfigurationId) : undefined
        )
        return res.ok(result)
      },
      {
        query: z.object({ mokaConfigurationId: z.string().optional() }),
        auth: true,
      }
    )
}
