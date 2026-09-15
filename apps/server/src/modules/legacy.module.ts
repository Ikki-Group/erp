import { Elysia } from 'elysia'

import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import { createAuthModule } from '@/modules/auth/index.ts'
import type { CompanyApi } from '@/modules/company/index.ts'
import type { IamApi } from '@/modules/iam/index.ts'
import { createInventoryModule } from '@/modules/inventory/index.ts'
import type { LocationApi } from '@/modules/location/index.ts'
import type { MaterialApi } from '@/modules/material/index.ts'
import type { MenuApi } from '@/modules/menu/index.ts'
import type { PaymentMethodApi } from '@/modules/payment-method/index.ts'
import { createPosModule } from '@/modules/pos/index.ts'
import { createProductionModule } from '@/modules/production/index.ts'
import type { RecipeApi } from '@/modules/recipe/index.ts'
import type { SupplierApi } from '@/modules/supplier/index.ts'
import type { UomApi } from '@/modules/uom/index.ts'

function requireApi<T>(
	deps: Record<string, { api?: Record<string, unknown> } | undefined>,
	name: string,
): T {
	const api = deps[name]?.api
	if (!api) throw new Error(`${name} API dependency is missing`)
	// ModuleDescriptor APIs are dynamically keyed by module name; each caller supplies the
	// concrete API type after the runtime presence check at this registry boundary.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return api as T
}

/**
 * Registry adapter for modules that have not yet been migrated to descriptors.
 * Each module ticket replaces its portion with a native descriptor and removes
 * this adapter once no legacy factory remains.
 */
export const legacyModule: ModuleDescriptor = {
	name: 'legacy',
	layer: 3,
	dependsOn: [
		'company',
		'location',
		'uom',
		'iam',
		'material',
		'supplier',
		'payment-method',
		'menu',
		'recipe',
	],
	create(ctx, deps) {
		const locationApi = requireApi<LocationApi>(deps, 'location')
		const locationRoute = deps.location?.route
		if (!locationRoute) throw new Error('Location route dependency is missing')
		const location = { service: locationApi.service, route: locationRoute }
		const uomApi = requireApi<UomApi>(deps, 'uom')
		const uom = { service: uomApi.service }
		const material = requireApi<MaterialApi>(deps, 'material')
		const supplier = requireApi<SupplierApi>(deps, 'supplier')
		const paymentMethod = requireApi<PaymentMethodApi>(deps, 'payment-method')
		const menu = requireApi<MenuApi>(deps, 'menu')
		const inventory = createInventoryModule(ctx.db, ctx.cacheClient, {
			uow: ctx.uow,
			audit: ctx.auditPort,
			events: ctx.events,
			assignmentService: material.assignmentService,
			locationService: location.service,
			materialService: material.service,
			supplierService: supplier.service,
			uomService: uom.service,
		})
		const recipe = requireApi<RecipeApi>(deps, 'recipe')
		const companyApi = requireApi<CompanyApi>(deps, 'company')
		const pos = createPosModule(ctx.db, ctx.cacheClient, {
			uow: ctx.uow,
			audit: ctx.auditPort,
			events: ctx.events,
			locationService: location.service,
			paymentMethodService: paymentMethod.service,
			companyApi,
			menuApi: menu,
			recipeService: recipe.service,
			inventoryApi: inventory.api.stock,
			uomService: uom.service,
			materialService: material.service,
		})
		const production = createProductionModule(ctx.db, ctx.cacheClient, {
			uow: ctx.uow,
			audit: ctx.auditPort,
			events: ctx.events,
			inventoryApi: inventory.api.stock,
			locationService: location.service,
			materialService: material.service,
			uomService: uom.service,
		})
		const iam = requireApi<IamApi>(deps, 'iam')
		const auth = createAuthModule({
			userRepo: iam.userRepo,
			assignmentService: iam.assignmentService,
			locationService: location.service,
			sessionStore: ctx.sessionStore,
		})

		const route = new Elysia({ name: 'legacy-module-routes' })
			.use(auth.route)
			.use(location.route)
			.use(pos.route)
			.use(inventory.route)
			.use(production.route)

		return { route }
	},
}
