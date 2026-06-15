import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { IamModule } from '@/modules/iam/iam.module'
import { LocationModule, createLocationModule } from '@/modules/location/location.module'

export interface Modules {
	location: LocationModule
	iam: IamModule
	// salesType: SalesTypeServiceModule
	// session: SessionServiceModule
	// auth: AuthServiceModule
	// tool: ToolServiceModule
	// material: MaterialModule
	// inventory: InventoryServiceModule

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
	// const location = new LocationServiceModule(db, cacheClient)
	// const iam = new IamService(db, cacheClient, { location: location.location })
	// const salesType = new SalesTypeServiceModule(db, cacheClient)
	// const session = new SessionServiceModule(db, cacheClient)
	// const auth = new AuthServiceModule({ session, iam })
	// const tool = new ToolServiceModule(db, { iam, salesType })
	// const material = new MaterialModule(db, cacheClient, { location: location.location })
	// const inventory = new InventoryServiceModule(db, cacheClient, { material })
	// return {
	// 	location,
	// 	iam,
	// 	salesType,
	// 	session,
	// 	auth,
	// 	tool,
	// 	material,
	// 	inventory,
	// }

	const location = new LocationModule()
}
