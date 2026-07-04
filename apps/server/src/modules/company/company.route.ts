import { Elysia } from 'elysia'

import type { CompanyModule } from './company.module'
import { createCompanySettingsRoute } from './company-settings.route'

export function createCompanyRoute(m: CompanyModule) {
	const settingsRouter = createCompanySettingsRoute(m.settings)

	return new Elysia({ prefix: '/company' }).use(settingsRouter)
}
