import Elysia from 'elysia'

import { res } from '@/lib/utils/response.util'
import { zResponse } from '@/lib/validation'

import { SettingsSummaryDto } from '../dto'
import type { DashboardServiceModule } from '../service'

export function initSettingsRoute(service: DashboardServiceModule) {
  return new Elysia({
    prefix: '/settings',
  }).get(
    '/summary',
    async function summary() {
      return res.ok(await service.settings.getSettingsSummary())
    },
    {
      response: zResponse.ok(SettingsSummaryDto),
    }
  )
}
