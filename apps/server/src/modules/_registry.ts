import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { createAuthModule, type AuthModule } from '@/modules/auth'
import { type IamModule, createIamModule } from '@/modules/iam/iam.module'
import { type LocationModule, createLocationModule } from '@/modules/location/location.module'
import { createSessionModule, type SessionModule } from '@/modules/session'
import type { ToolModule } from '@/modules/tool'
import { createToolModule } from '@/modules/tool/tool.module'

export interface Modules {
	location: LocationModule
	iam: IamModule
	session: SessionModule
	auth: AuthModule
	tool: ToolModule
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

	const location = createLocationModule(db, cacheClient)
	const iam = createIamModule(db, cacheClient, { location: location })
	const session = createSessionModule(db, cacheClient)
	const auth = createAuthModule(db, cacheClient, {
		iam,
		session,
	})
	const tool = createToolModule(db, {
		iam,
		location,
	})

	return {
		location,
		iam,
		session,
		auth,
		tool,
	}
}
