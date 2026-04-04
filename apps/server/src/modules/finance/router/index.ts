import Elysia from 'elysia'
import type { FinanceServiceModule } from '../service'
import { initAccountRoute } from './account.route'
import { initJournalRoute } from './journal.route'

export function initFinanceRouteModule(service: FinanceServiceModule) {
  const accountRouter = initAccountRoute(service)
  const journalRouter = initJournalRoute(service.journal)

  return new Elysia({ prefix: '/finance' }).use(accountRouter).use(journalRouter)
}
