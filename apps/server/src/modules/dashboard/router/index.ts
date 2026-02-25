import Elysia from 'elysia'

import type { DashboardServiceModule } from '../service'

import { initSettingsRoute } from './settings.route'

export function initDashboardRouteModule(service: DashboardServiceModule) {
  return new Elysia({
    prefix: '/dashboard',
  }).use(initSettingsRoute(service))
}
