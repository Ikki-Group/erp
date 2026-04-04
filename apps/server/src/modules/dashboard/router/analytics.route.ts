import { Elysia } from 'elysia'
import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import type { AnalyticsService } from '../service'
import * as dto from '../dto'

export function AnalyticsRoute(service: AnalyticsService) {
  return new Elysia({ prefix: '/analytics', detail: { tags: ['Dashboard - Analytics'] } })
    .use(authPluginMacro)

    .post(
      '/pnl',
      async ({ body }) => {
        const { startDate, endDate } = body
        const result = await service.getPnL(startDate, endDate)
        return res.ok(result)
      },
      { body: dto.PnLRequestDto, auth: true },
    )

    .post(
      '/top-sales',
      async ({ body }) => {
        const { startDate, endDate, limit } = body
        const result = await service.getTopSales(startDate, endDate, limit)
        return res.ok(result)
      },
      { body: dto.TopSalesRequestDto, auth: true },
    )
}
