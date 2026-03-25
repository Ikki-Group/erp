import Elysia from 'elysia'

import type { MokaServiceModule } from '../service'

import { initMokaConfigurationRoute } from './moka-configuration.route'
import { initMokaScrapRoute } from './moka-scrap.route'

export function initMokaRouteModule(s: MokaServiceModule) {
  return new Elysia({ prefix: '/moka' })
    .use(initMokaConfigurationRoute(s.configuration))
    .use(initMokaScrapRoute(s.scrap, s.history))
}
