import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { LocationServiceModule } from './location'
import { IamServiceModule } from './iam'
import { SalesTypeServiceModule } from './sales-type'

export interface Modules {
	location: LocationServiceModule
	iam: IamServiceModule
	salesType: SalesTypeServiceModule

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

	return {
		location,
		iam,
		salesType,
	}
}
