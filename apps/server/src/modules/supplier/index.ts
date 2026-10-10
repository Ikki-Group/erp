import type { Infra } from '@/shared/module.ts'

import type { MaterialService } from '@/modules/material/index.ts'
import type { UomService } from '@/modules/uom/index.ts'

import { SupplierRepo } from './supplier.repo.ts'
import { createSupplierRoute } from './supplier.route.ts'
import { SupplierService } from './supplier.service.ts'

export function createSupplierModule(
	infra: Infra,
	deps: {
		material: Pick<MaterialService, 'handleGetById'>
		uom: Pick<UomService, 'handleGetById'>
	},
) {
	const supplierService = new SupplierService({
		...infra,
		repo: new SupplierRepo(infra.db),
		material: deps.material,
		uom: deps.uom,
	})
	return { route: createSupplierRoute(supplierService), supplierService }
}

export type { SupplierService }
export { SupplierDto, SupplierMaterialDto } from './supplier.contract.ts'
export type {
	SupplierCreateDto,
	SupplierUpdateDto,
	SupplierFilterDto,
	SupplierMaterialCreateDto,
	SupplierMaterialUpdateDto,
	SupplierMaterialFilterDto,
} from './supplier.contract.ts'
