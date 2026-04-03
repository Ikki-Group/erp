import Elysia from 'elysia'
import type { FinanceServiceModule } from '../service'
import { initAccountRoute } from './account.route'

export function initFinanceRouteModule(service: FinanceServiceModule) {
  const accountRouter = initAccountRoute(service)
  return new Elysia({ prefix: '/finance' }).use(accountRouter)
}

export * from './account.route'
