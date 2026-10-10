import type { Infra } from '@/shared/module.ts'

import { createAuditModule } from './audit/index.ts'
import { createAuthModule } from './auth/index.ts'
import { createCompanyModule } from './company/index.ts'
import { createIamModule } from './iam/index.ts'
import { createInventoryModule } from './inventory/index.ts'
import { createLocationModule } from './location/index.ts'
import { createMaterialModule } from './material/index.ts'
import { createMenuModule } from './menu/index.ts'
import { createPaymentMethodModule } from './payment-method/index.ts'
import { createPosModule } from './pos/index.ts'
import { createProductionModule } from './production/index.ts'
import { createRecipeModule } from './recipe/index.ts'
import { createSupplierModule } from './supplier/index.ts'
import { createUomModule } from './uom/index.ts'

/**
 * Builds every module in dependency order. Ordering is enforced by the
 * compiler: a module can only receive services that were constructed above it.
 */
export function createModules(infra: Infra) {
	const audit = createAuditModule(infra)
	const company = createCompanyModule(infra)
	const location = createLocationModule(infra)
	const uom = createUomModule(infra)
	const iam = createIamModule(infra, { location: location.service })
	const auth = createAuthModule(infra, {
		users: {
			findCredentials: (username) => iam.userService.findCredentials(username),
			handleUserDetail: (id) => iam.composedService.handleUserDetail(id),
		},
		locations: location.service,
	})
	const material = createMaterialModule(infra, { uom: uom.uomService, location: location.service })
	const supplier = createSupplierModule(infra, {
		material: material.materialService,
		uom: uom.uomService,
	})
	const paymentMethod = createPaymentMethodModule(infra, { location: location.service })
	const menu = createMenuModule(infra)
	const inventory = createInventoryModule(infra, {
		location: location.service,
		material: material.materialService,
		materialAssignment: material.assignmentService,
		supplier: supplier.supplierService,
		uom: uom.uomService,
	})
	const recipe = createRecipeModule(infra, {
		menu: menu.itemService,
		material: material.materialService,
		uom: uom.uomService,
		stock: inventory.stockService,
	})
	const production = createProductionModule(infra, {
		stock: inventory.stockService,
		location: location.service,
		material: material.materialService,
		uom: uom.uomService,
	})
	const pos = createPosModule(infra, {
		location: location.service,
		paymentMethod: paymentMethod.paymentMethodService,
		company: company.service,
		menu: menu.composedService,
		recipe: recipe.recipeService,
		stock: inventory.stockService,
		uom: uom.uomService,
		material: material.materialService,
	})

	return [
		auth.route,
		audit.route,
		company.route,
		location.route,
		uom.route,
		iam.route,
		material.route,
		supplier.route,
		paymentMethod.route,
		menu.route,
		inventory.route,
		recipe.route,
		production.route,
		pos.route,
	]
}
