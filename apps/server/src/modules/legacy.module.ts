import { Elysia } from 'elysia'

import { cache } from '@/infra/cache/index.ts'
import { sessionStore } from '@/infra/session/index.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import { createAuthModule } from '@/modules/auth/index.ts'
import type { CompanyApi } from '@/modules/company/index.ts'
import type { IamApi } from '@/modules/iam/index.ts'
import { createInventoryModule } from '@/modules/inventory/index.ts'
import type { LocationApi } from '@/modules/location/index.ts'
import type { MaterialApi } from '@/modules/material/index.ts'
import { createMenuModule } from '@/modules/menu/index.ts'
import { createPaymentMethodModule } from '@/modules/payment-method/index.ts'
import { createPosModule } from '@/modules/pos/index.ts'
import { createProductionModule } from '@/modules/production/index.ts'
import { createRecipeModule } from '@/modules/recipe/index.ts'
import type { SupplierApi } from '@/modules/supplier/index.ts'
import type { UomApi } from '@/modules/uom/index.ts'

function isSupplierApi(api: Record<string, unknown> | undefined): api is SupplierApi {
	return Boolean(api && api.service && typeof api.service === 'object')
}
function isMaterialApi(api: Record<string, unknown> | undefined): api is MaterialApi {
	return Boolean(api && api.service && api.assignmentService)
}
function isIamApi(api: Record<string, unknown> | undefined): api is IamApi {
	return Boolean(api && api.userRepo && api.assignmentService)
}
function isCompanyApi(api: Record<string, unknown> | undefined): api is CompanyApi {
	if (!api || typeof api.taxRate !== 'object' || api.taxRate === null) return false
	return 'getPercent' in api.taxRate && typeof api.taxRate.getPercent === 'function'
}

function isLocationApi(api: Record<string, unknown> | undefined): api is LocationApi {
	const service = api?.service
	if (!api || typeof service !== 'object' || service === null) return false
	return 'getById' in service && 'handleGetById' in service && 'handleCreate' in service
}

function isUomApi(api: Record<string, unknown> | undefined): api is UomApi {
	const service = api?.service
	if (!api || typeof service !== 'object' || service === null) return false
	return 'getAllConversions' in api && 'handleGetById' in service && 'handleCreate' in service
}

/**
 * Registry adapter for modules that have not yet been migrated to descriptors.
 * Each module ticket replaces its portion with a native descriptor and removes
 * this adapter once no legacy factory remains.
 */
export const legacyModule: ModuleDescriptor = {
	name: 'legacy',
	layer: 3,
	dependsOn: ['company', 'location', 'uom', 'iam', 'material', 'supplier'],
	create(ctx, deps) {
		const locationApi = deps.location?.api
		const locationRoute = deps.location?.route
		if (!isLocationApi(locationApi) || !locationRoute)
			throw new Error('Location API dependency is missing')
		const location = { service: locationApi.service, route: locationRoute }
		const uomApi = deps.uom?.api
		if (!isUomApi(uomApi)) throw new Error('UoM API dependency is missing')
		const uom = { service: uomApi.service }
		const materialApi = deps.material?.api
		if (!isMaterialApi(materialApi)) throw new Error('Material API dependency is missing')
		const material = materialApi
		const supplierApi = deps.supplier?.api
		if (!isSupplierApi(supplierApi)) throw new Error('Supplier API dependency is missing')
		const supplier = supplierApi
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
		const companyApi = deps.company?.api
		if (!isCompanyApi(companyApi)) throw new Error('Company API dependency is missing')
		const pos = createPosModule(ctx.db, cache, {
			locationService: location.service,
			paymentMethodService: paymentMethod.service,
			companyApi,
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
		const iamApi = deps.iam?.api
		if (!isIamApi(iamApi)) throw new Error('IAM API dependency is missing')
		const iam = iamApi
		const auth = createAuthModule({
			userRepo: iam.userRepo,
			assignmentService: iam.assignmentService,
			locationService: location.service,
			sessionStore,
		})

		const route = new Elysia({ name: 'legacy-module-routes' })
			.use(auth.route)
			.use(location.route)
			.use(paymentMethod.route)
			.use(pos.route)
			.use(inventory.route)
			.use(menu.route)
			.use(recipe.route)
			.use(production.route)

		return { route }
	},
}
