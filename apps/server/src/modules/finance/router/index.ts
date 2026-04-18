import Elysia from 'elysia'
import type { FinanceServiceModule } from '../service'
import { initAccountRoute } from './account.route'
import { initJournalRoute } from './journal.route'
import { initExpenditureRoute } from './expenditure.route'

export function initFinanceRouteModule(service: FinanceServiceModule) {
	const accountRouter = initAccountRoute(service)
	const journalRouter = initJournalRoute(service.journal)
	const expenditureRouter = initExpenditureRoute(service)

	return new Elysia({ prefix: '/finance' }).use(accountRouter).use(journalRouter).use(expenditureRouter)
}
