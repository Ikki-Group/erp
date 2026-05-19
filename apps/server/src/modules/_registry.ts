import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { LocationServiceModule } from './location'
import { IamServiceModule } from './iam'
import { SalesTypeServiceModule } from './sales-type'
import { SessionServiceModule } from './session'
import { AuthServiceModule } from './auth'
import { ToolServiceModule } from './tool'

export interface Modules {
	location: LocationServiceModule
	iam: IamServiceModule
	salesType: SalesTypeServiceModule
	session: SessionServiceModule
	auth: AuthServiceModule
	tool: ToolServiceModule

	// location: LocationServiceModule
	// product: ProductServiceModule
	// session: SessionServiceModule

	// // material: MaterialModule
	// supplier: SupplierServiceModule
	// hr: HRServiceModule
	// finance: FinanceServiceModule
	// crm: CrmServiceModule
	// company: CompanyServiceModule
	// audit: AuditServiceModule

	// auth: AuthServiceModule

	// inventory: InventoryServiceModule
	// recipe: RecipeServiceModule
	// sales: SalesServiceModule
	// purchasing: PurchasingServiceModule

	// moka: MokaServiceModule

	// production: ProductionServiceModule
	// dashboard: DashboardServiceModule
	// payment: PaymentServiceModule
	// reporting: ReportingServiceModule
}

export function createModules(db: DbClient, cacheClient: CacheClient): Modules {
	const location = new LocationServiceModule(db, cacheClient)
	const iam = new IamServiceModule(db, cacheClient, { location })
	const salesType = new SalesTypeServiceModule(db, cacheClient)
	const session = new SessionServiceModule(db, cacheClient)
	const auth = new AuthServiceModule({ session, iam })
	const tool = new ToolServiceModule(db, { iam, salesType })

	return {
		location,
		iam,
		salesType,
		session,
		auth,
		tool,
	}
}
