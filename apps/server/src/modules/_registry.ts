import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import { createAuthModule, type AuthModule } from '@/modules/auth'
import { createAuditLogModule, type AuditLogModule } from '@/modules/audit/audit-log.module'
import { createCompanyModule, type CompanyModule } from '@/modules/company/company.module'
import { createCrmModule, type CrmModule } from '@/modules/crm/crm.module'
import { DashboardServiceModule } from '@/modules/dashboard'
import { createFinanceModule, type FinanceModule } from '@/modules/finance'
import { createHRServiceModule, type HRServiceModule } from '@/modules/hr'
import { type IamModule, createIamModule } from '@/modules/iam/iam.module'
import { createInventoryModule, type InventoryModule } from '@/modules/inventory'
import { type LocationModule, createLocationModule } from '@/modules/location/location.module'
import { createMaterialModule, type MaterialModule } from '@/modules/material'
import { createMokaServiceModule, type MokaServiceModule } from '@/modules/moka'
import { createPaymentServiceModule, type PaymentServiceModule } from '@/modules/payment'
import { createProductModule, type ProductModule } from '@/modules/product/product.module'
import { createProductionServiceModule, type ProductionServiceModule } from '@/modules/production'
import { createPurchasingServiceModule, type PurchasingServiceModule } from '@/modules/purchasing'
import { createRecipeModule, type RecipeModule } from '@/modules/recipe'
import { ReportingServiceModule } from '@/modules/reporting'
import { createSalesModule, type SalesModule } from '@/modules/sales'
import { createSalesTypeModule, type SalesTypeModule } from '@/modules/sales-type'
import { createSessionModule, type SessionModule } from '@/modules/session'
import { createSupplierModule, type SupplierModule } from '@/modules/supplier'
import type { ToolModule } from '@/modules/tool'
import { createToolModule } from '@/modules/tool/tool.module'
import { createUomModule, type UomModule } from '@/modules/uom/uom.module'

export interface Modules {
	// Core (Layer 0)
	session: SessionModule
	auth: AuthModule
	// Master data (Layer 1)
	auditLog: AuditLogModule
	company: CompanyModule
	location: LocationModule
	uom: UomModule
	salesType: SalesTypeModule
	supplier: SupplierModule
	crm: CrmModule
	product: ProductModule
	recipe: RecipeModule
	finance: FinanceModule
	iam: IamModule
	material: MaterialModule
	// Operations (Layer 2)
	inventory: InventoryModule
	production: ProductionServiceModule
	purchasing: PurchasingServiceModule
	payment: PaymentServiceModule
	sales: SalesModule
	hr: HRServiceModule
	moka: MokaServiceModule
	// Aggregators (Layer 3)
	dashboard: DashboardServiceModule
	reporting: ReportingServiceModule
	// Tooling
	tool: ToolModule
}

/**
 * Composition root — the single place where the whole module graph is wired.
 *
 * This is an explicit, plain factory (no DI container / magic): each module
 * receives exactly the dependencies it needs as constructor args. The
 * declaration order below is a manual topological sort — a module MUST be
 * created AFTER everything it depends on.
 *
 * Dependency layers (lower depends on nothing above it):
 *
 *   Layer 0 (core):    session
 *   Layer 1 (master):  auditLog, company, location, uom, salesType, supplier,
 *                      crm, product, recipe, finance, iam
 *                      material (needs location)
 *   Layer 2 (ops):     inventory (needs material)
 *                      production (needs recipe + inventory.transaction)
 *                      purchasing (needs location, supplier, material, inventory)
 *                      payment
 *                      sales (needs location, crm, product, salesType)
 *                      hr (needs finance)
 *                      moka (needs finance)
 *   Layer 3 (aggr):    dashboard (needs iam, location, finance, sales)
 *                      reporting
 *   Core (late):       auth (needs iam + session)
 *   Tooling:           tool (needs iam + location)
 *
 * When adding a module: create it below in dependency order, add it to the
 * returned object, and add its field to the `Modules` interface above. If it
 * has HTTP routes, also register it in `_routes.ts`.
 */
export function createModules(db: DbClient, cacheClient: CacheClient): Modules {
	// ---- Layer 0 (core) ---------------------------------------------------
	const session = createSessionModule(db, cacheClient)

	// ---- Layer 1 (master data) -------------------------------------------
	const auditLog = createAuditLogModule(db, cacheClient)
	const company = createCompanyModule(db, cacheClient)
	const location = createLocationModule(db, cacheClient)
	const uom = createUomModule(db, cacheClient)
	const salesType = createSalesTypeModule(db, cacheClient)
	const supplier = createSupplierModule(db, cacheClient)
	const crm = createCrmModule(db, cacheClient)
	const product = createProductModule(db, cacheClient)
	const recipe = createRecipeModule(db, cacheClient)
	const finance = createFinanceModule(db, cacheClient)
	const iam = createIamModule(db, cacheClient, { location })
	const material = createMaterialModule(db, cacheClient, { location })

	// ---- Layer 2 (operations) --------------------------------------------
	const inventory = createInventoryModule(db, cacheClient, { material })
	const production = createProductionServiceModule(db, cacheClient, {
		recipe,
		stockTransaction: inventory.transaction,
	})
	const purchasing = createPurchasingServiceModule(
		db,
		cacheClient,
		{
			location: { getById: (id) => location.getById(id) },
			supplier: { getById: (id) => supplier.getById(id) },
			material: { getById: (id) => material.master.findById(id) },
		},
		inventory,
	)
	const payment = createPaymentServiceModule(db, cacheClient)
	const sales = createSalesModule(db, cacheClient, { location, crm, product, salesType })
	const hr = createHRServiceModule(db, cacheClient, { finance })
	const moka = createMokaServiceModule(db, cacheClient, finance)

	// ---- Layer 3 (aggregators) -------------------------------------------
	const dashboard = new DashboardServiceModule(db, cacheClient, {
		iam,
		location,
		finance,
		sales,
	})
	const reporting = new ReportingServiceModule(db)

	// ---- Core (late) + tooling -------------------------------------------
	const auth = createAuthModule(db, cacheClient, { iam, session })
	const tool = createToolModule(db, { iam, location })

	return {
		session,
		auth,
		auditLog,
		company,
		location,
		uom,
		salesType,
		supplier,
		crm,
		product,
		recipe,
		finance,
		iam,
		material,
		inventory,
		production,
		purchasing,
		payment,
		sales,
		hr,
		moka,
		dashboard,
		reporting,
		tool,
	}
}
