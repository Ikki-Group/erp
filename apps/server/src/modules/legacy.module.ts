import { Elysia } from 'elysia'

import { cache } from '@/infra/cache/index.ts'
import { sessionStore } from '@/infra/session/index.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import { createAuthModule } from '@/modules/auth/index.ts'
import { createCompanyModule } from '@/modules/company/index.ts'
import { createIamModule } from '@/modules/iam/index.ts'
import { createInventoryModule } from '@/modules/inventory/index.ts'
import { createLocationModule } from '@/modules/location/index.ts'
import { createMaterialModule } from '@/modules/material/index.ts'
import { createMenuModule } from '@/modules/menu/index.ts'
import { createPaymentMethodModule } from '@/modules/payment-method/index.ts'
import { createPosModule } from '@/modules/pos/index.ts'
import { createProductionModule } from '@/modules/production/index.ts'
import { createRecipeModule } from '@/modules/recipe/index.ts'
import { createSupplierModule } from '@/modules/supplier/index.ts'
import { createUomModule } from '@/modules/uom/index.ts'

/**
 * Registry adapter for modules that have not yet been migrated to descriptors.
 * Each module ticket replaces its portion with a native descriptor and removes
 * this adapter once no legacy factory remains.
 */
export const legacyModule: ModuleDescriptor = {
	name: 'legacy',
	layer: 0,
	dependsOn: [],
	create(ctx) {
		const location = createLocationModule(ctx.db, cache)
		const company = createCompanyModule(ctx.db, cache)
		const uom = createUomModule(ctx.db, cache)
		const material = createMaterialModule(ctx.db, cache, {
			uomService: uom.service,
			locationService: location.service,
		})
		const supplier = createSupplierModule(ctx.db, cache, {
			materialService: material.service,
			uomService: uom.service,
		})
		const paymentMethod = createPaymentMethodModule(ctx.db, cache, {
			locationService: location.service,
		})
		const menu = createMenuModule(ctx.db, cache, {
			locationService: location.service,
		})
		const inventory = createInventoryModule(ctx.db, cache, {
			assignmentService: material.assignmentService,
			locationService: location.service,
			materialService: material.service,
			supplierService: supplier.service,
			uomService: uom.service,
		})
		const recipe = createRecipeModule(ctx.db, cache, {
			materialService: material.service,
			uomService: uom.service,
			itemService: menu.itemService,
		})
		const pos = createPosModule(ctx.db, cache, {
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
		const production = createProductionModule(ctx.db, cache, {
			stockService: inventory.stockService,
			locationService: location.service,
			materialService: material.service,
			uomService: uom.service,
		})
		const iam = createIamModule(ctx.db, cache, { locationService: location.service })
		const auth = createAuthModule({
			userRepo: iam.userRepo,
			assignmentService: iam.assignmentService,
			locationService: location.service,
			sessionStore,
		})

		const route = new Elysia({ name: 'legacy-module-routes' })
			.use(auth.route)
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

		return { route }
	},
}
