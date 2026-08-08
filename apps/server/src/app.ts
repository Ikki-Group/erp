import cors from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'

import { cache } from './infra/cache/index.ts'
import { db } from './infra/database/index.ts'
import { otelPlugin } from './infra/otel/otel.ts'
import { sessionStore } from './infra/session/index.ts'
import { createAuditModule } from './modules/audit/index.ts'
import { createAuthModule } from './modules/auth/index.ts'
import { createCompanyModule } from './modules/company/index.ts'
import { createIamModule } from './modules/iam/index.ts'
import { createInventoryModule } from './modules/inventory/index.ts'
import { createLocationModule } from './modules/location/index.ts'
import { createMaterialModule } from './modules/material/index.ts'
import { createMenuModule } from './modules/menu/index.ts'
import { createPaymentMethodModule } from './modules/payment-method/index.ts'
import { createPosModule } from './modules/pos/index.ts'
import { createProductionModule } from './modules/production/index.ts'
import { createRecipeModule } from './modules/recipe/index.ts'
import { createSupplierModule } from './modules/supplier/index.ts'
import { createUomModule } from './modules/uom/index.ts'
import { errorPlugin } from './server/plugins/error.plugin.ts'
import { isDev } from './shared/config/env.ts'

// ─── Modules ───

const location = createLocationModule(db, cache)
const company = createCompanyModule(db, cache)
const uom = createUomModule(db, cache)
const material = createMaterialModule(db, cache, {
	uomService: uom.service,
	locationService: location.service,
})
const supplier = createSupplierModule(db, cache, {
	materialService: material.service,
	uomService: uom.service,
})
const paymentMethod = createPaymentMethodModule(db, cache, {
	locationService: location.service,
})
const menu = createMenuModule(db, cache, {
	locationService: location.service,
})
const inventory = createInventoryModule(db, cache, {
	assignmentService: material.assignmentService,
	locationService: location.service,
	materialService: material.service,
	supplierService: supplier.service,
	uomService: uom.service,
})
const recipe = createRecipeModule(db, cache, {
	materialService: material.service,
	uomService: uom.service,
	itemService: menu.itemService,
})
const pos = createPosModule(db, cache, {
	locationService: location.service,
	paymentMethodService: paymentMethod.service,
	companyService: company.service,
	itemService: menu.itemService,
	composedService: menu.composedService,
	recipeService: recipe.service,
	stockService: inventory.stockService,
	uomService: uom.service,
	materialService: material.service,
})
const production = createProductionModule(db, cache, {
	stockService: inventory.stockService,
	locationService: location.service,
	materialService: material.service,
	uomService: uom.service,
})
const iam = createIamModule(db, cache, { locationService: location.service })
const audit = createAuditModule(db)
const auth = createAuthModule({
	userRepo: iam.userRepo,
	assignmentService: iam.assignmentService,
	locationService: location.service,
	sessionStore,
})

// ─── App ───

const base = new Elysia().use(cors())
if (otelPlugin) base.use(otelPlugin)

export const app = base
	.use(
		openapi({
			enabled: isDev,
			path: '/openapi',
			documentation: {
				info: {
					title: 'Ikki ERP API',
					version: '1.0.0',
					description: 'API documentation for Ikki ERP server',
				},
			},
			exclude: {
				paths: ['/health'],
			},
		}),
	)
	.use(errorPlugin)
	.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }), {
		detail: { hide: true },
	})
	.use(auth.route)
	.use(audit.route)
	.use(company.route)
	.use(location.route)
	.use(iam.route)
	.use(uom.route)
	.use(material.route)
	.use(supplier.route)
	.use(paymentMethod.route)
	.use(pos.route)
	.use(inventory.route)
	.use(menu.route)
	.use(recipe.route)
	.use(production.route)
