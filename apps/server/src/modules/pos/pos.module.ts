import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { CompanyApi } from '@/modules/company/index.ts'
import type { InventoryApi } from '@/modules/inventory/index.ts'
import type { LocationApi } from '@/modules/location/index.ts'
import type { MaterialApi } from '@/modules/material/index.ts'
import type { MenuApi } from '@/modules/menu/index.ts'
import type { PaymentMethodApi } from '@/modules/payment-method/index.ts'
import type { RecipeApi } from '@/modules/recipe/index.ts'
import type { UomApi } from '@/modules/uom/index.ts'

import { createOrderModule } from './order/order.module.ts'
import { createPosRoute } from './pos.route.ts'
import { createShiftModule } from './shift/shift.module.ts'
import { createTableModule } from './table/table.module.ts'
import { createVoucherModule } from './voucher/voucher.module.ts'

// ─── Dependencies ───

interface PosModuleDeps {
	uow: UnitOfWork
	audit: AuditPort
	locationService: LocationApi['service']
	paymentMethodService: PaymentMethodApi['service']
	companyApi: CompanyApi
	menuApi: MenuApi
	recipeService: RecipeApi['service']
	inventoryApi: InventoryApi['stock']
	uomService: UomApi['service']
	materialService: MaterialApi['service']
}

// ─── Module Factory ───

function createPosModule(db: DbContext, cacheClient: CacheClient, deps: PosModuleDeps) {
	const voucher = createVoucherModule(db, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
	})
	const shift = createShiftModule(db, cacheClient, {
		locationService: deps.locationService,
		uow: deps.uow,
		audit: deps.audit,
	})
	const table = createTableModule(db, cacheClient, {
		locationService: deps.locationService,
		uow: deps.uow,
		audit: deps.audit,
	})
	const order = createOrderModule(db, cacheClient, {
		uow: deps.uow,
		audit: deps.audit,
		shiftService: shift.service,
		tableService: table.service,
		voucherService: voucher.service,
		paymentMethodService: deps.paymentMethodService,
		companyApi: deps.companyApi,
		menuItemDetail: deps.menuApi.itemDetail,
		locationService: deps.locationService,
		recipeService: deps.recipeService,
		inventoryApi: deps.inventoryApi,
		uomService: deps.uomService,
		materialService: deps.materialService,
	})

	return { route: createPosRoute({ voucher, shift, table, order }) }
}

// ─── Descriptor ───

function isLocationApi(api: Record<string, unknown> | undefined): api is LocationApi {
	return typeof api?.getById === 'function' && typeof api.service === 'object'
}

function isPaymentMethodApi(api: Record<string, unknown> | undefined): api is PaymentMethodApi {
	return typeof api?.service === 'object' && typeof api.byLocation === 'function'
}

function isCompanyApi(api: Record<string, unknown> | undefined): api is CompanyApi {
	return typeof api?.taxRate === 'object'
}

function isMenuApi(api: Record<string, unknown> | undefined): api is MenuApi {
	return typeof api?.itemDetail === 'function'
}

function isRecipeApi(api: Record<string, unknown> | undefined): api is RecipeApi {
	return typeof api?.service === 'object' && typeof api.activeByMenuItem === 'function'
}

function isInventoryApi(api: Record<string, unknown> | undefined): api is InventoryApi {
	return typeof api?.stock === 'object'
}

function isUomApi(api: Record<string, unknown> | undefined): api is UomApi {
	return typeof api?.service === 'object' && typeof api.getAllConversions === 'function'
}

function isMaterialApi(api: Record<string, unknown> | undefined): api is MaterialApi {
	return typeof api?.service === 'object' && typeof api.assignmentService === 'object'
}

export const posModule: ModuleDescriptor = {
	name: 'pos',
	layer: 3,
	dependsOn: [
		'location',
		'payment-method',
		'company',
		'menu',
		'recipe',
		'inventory',
		'uom',
		'material',
	],
	create(ctx, deps) {
		const location = deps.location?.api
		const paymentMethod = deps['payment-method']?.api
		const company = deps.company?.api
		const menu = deps.menu?.api
		const recipe = deps.recipe?.api
		const inventory = deps.inventory?.api
		const uom = deps.uom?.api
		const material = deps.material?.api
		if (
			!isLocationApi(location) ||
			!isPaymentMethodApi(paymentMethod) ||
			!isCompanyApi(company) ||
			!isMenuApi(menu) ||
			!isRecipeApi(recipe) ||
			!isInventoryApi(inventory) ||
			!isUomApi(uom) ||
			!isMaterialApi(material)
		)
			throw new Error('POS dependencies are missing')
		return createPosModule(ctx.db, ctx.cacheClient, {
			uow: ctx.uow,
			audit: ctx.auditPort,
			locationService: location.service,
			paymentMethodService: paymentMethod.service,
			companyApi: company,
			menuApi: menu,
			recipeService: recipe.service,
			inventoryApi: inventory.stock,
			uomService: uom.service,
			materialService: material.service,
		})
	},
}
