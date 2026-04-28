import { createCache } from '@/core/cache'
import type { DbClient } from '@/core/database'
import { logger } from '@/core/logger'

import { AuthServiceModule } from './auth'
import { DashboardServiceModule } from './dashboard'
import { EmployeeServiceModule } from './employee'
import { FinanceServiceModule } from './finance'
import { HRServiceModule } from './hr'
import { IamServiceModule } from './iam'
import { InventoryServiceModule } from './inventory'
import { LocationServiceModule } from './location'
import { MaterialServiceModule } from './material'
import { MokaServiceModule } from './moka'
import { ProductServiceModule } from './product'
import { ProductionServiceModule } from './production'
import { PurchasingServiceModule } from './purchasing'
import { RecipeServiceModule } from './recipe'
import { SalesServiceModule } from './sales'
import { SupplierServiceModule } from './supplier'
import { ToolServiceModule } from './tool'

export interface Modules {
	location: LocationServiceModule
	product: ProductServiceModule

	iam: IamServiceModule
	material: MaterialServiceModule
	supplier: SupplierServiceModule
	employee: EmployeeServiceModule
	finance: FinanceServiceModule

	auth: AuthServiceModule

	inventory: InventoryServiceModule
	recipe: RecipeServiceModule
	sales: SalesServiceModule
	purchasing: PurchasingServiceModule

	moka: MokaServiceModule

	production: ProductionServiceModule
	hr: HRServiceModule
	dashboard: DashboardServiceModule
	tool: ToolServiceModule
}

export function initModules(db: DbClient): Modules {
	const cacheClient = createCache()

	// Layer 0 — Core
	const location = new LocationServiceModule(db, cacheClient)
	const product = new ProductServiceModule(db, cacheClient)

	// Layer 1 — Masters
	const iam = new IamServiceModule(db, cacheClient, { location })
	const material = new MaterialServiceModule(location.master)
	const supplier = new SupplierServiceModule(db, cacheClient)
	const employee = new EmployeeServiceModule(db, cacheClient)
	const finance = new FinanceServiceModule(db, cacheClient)

	// Layer 1.5 — Auth (Depends on Iam)
	const auth = new AuthServiceModule(db, cacheClient, iam)

	// Layer 2 — Operations
	const inventory = new InventoryServiceModule(db, cacheClient, material)
	const recipe = new RecipeServiceModule(db, cacheClient)
	const sales = new SalesServiceModule(db, cacheClient)
	const purchasing = new PurchasingServiceModule(db, cacheClient, inventory)

	const moka = new MokaServiceModule(logger, finance)

	// Layer 3 — Aggregators
	const production = new ProductionServiceModule(db, cacheClient, recipe.recipe, inventory)
	const hr = new HRServiceModule(db, cacheClient, finance)
	const dashboard = new DashboardServiceModule(db, cacheClient, iam, location, finance, sales)
	const tool = new ToolServiceModule(db, iam, location, product, material)

	return {
		location,
		product,
		iam,
		material,
		auth,
		inventory,
		recipe,
		dashboard,
		tool,
		moka,
		sales,
		supplier,
		employee,
		finance,
		purchasing,
		production,
		hr,
	}
}
