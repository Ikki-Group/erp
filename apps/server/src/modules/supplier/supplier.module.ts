import { cache } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { ModuleDescriptor } from '@/shared/module/registry.ts'

import type { MaterialApi } from '@/modules/material/index.ts'
import type { UomApi } from '@/modules/uom/index.ts'

import { SupplierRepo } from './supplier.repo.ts'
import { createSupplierRoute } from './supplier.route.ts'
import { SupplierService } from './supplier.service.ts'

function createSupplierModule(
	db: DbContext,
	deps: { materialService: MaterialApi['service']; uomService: UomApi['service'] },
) {
	const service = new SupplierService(
		new SupplierRepo(db),
		cache,
		deps.materialService,
		deps.uomService,
	)
	return { route: createSupplierRoute(service), service }
}

export interface SupplierApi extends Record<string, unknown> {
	service: SupplierService
	getById: SupplierService['getById']
	handleGetById: SupplierService['handleGetById']
	handleList: SupplierService['handleList']
	handleCreate: SupplierService['handleCreate']
	handleUpdate: SupplierService['handleUpdate']
	handleDelete: SupplierService['handleDelete']
}

function isMaterialApi(api: Record<string, unknown> | undefined): api is MaterialApi {
	return Boolean(api?.service && typeof api.service === 'object' && 'assignmentService' in api)
}

function isUomApi(api: Record<string, unknown> | undefined): api is UomApi {
	return Boolean(api?.service && typeof api.service === 'object' && 'getAllConversions' in api)
}

export const supplierModule: ModuleDescriptor = {
	name: 'supplier',
	layer: 1,
	dependsOn: ['material', 'uom'],
	create(ctx, deps) {
		if (!isMaterialApi(deps.material?.api) || !isUomApi(deps.uom?.api))
			throw new Error('Supplier dependencies are missing')
		const built = createSupplierModule(ctx.db, {
			materialService: deps.material.api.service,
			uomService: deps.uom.api.service,
		})
		return {
			route: built.route,
			api: {
				service: built.service,
				getById: built.service.getById.bind(built.service),
				handleGetById: built.service.handleGetById.bind(built.service),
				handleList: built.service.handleList.bind(built.service),
				handleCreate: built.service.handleCreate.bind(built.service),
				handleUpdate: built.service.handleUpdate.bind(built.service),
				handleDelete: built.service.handleDelete.bind(built.service),
			},
		}
	},
}
