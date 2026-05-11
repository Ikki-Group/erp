import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { LocationMasterService } from '@/modules/location'

import { MaterialCategoryRepo } from './material-category/material-category.repo'
import { initMaterialCategoryRoute } from './material-category/material-category.route'
import { MaterialCategoryService } from './material-category/material-category.service'
import { MaterialLocationRepo } from './material-location/material-location.repo'
import { initMaterialLocationRoute } from './material-location/material-location.route'
import { MaterialLocationService } from './material-location/material-location.service'
import { MaterialRepo } from './material-master/material.repo'
import { initMaterialMasterRoute } from './material-master/material.route'
import { MaterialService } from './material-master/material.service'
import { MaterialQueryRepo } from './material-query/material-query.repo'
import { initMaterialQueryRoute } from './material-query/material-query.route'
import { MaterialQueryService } from './material-query/material-query.service'
import { UomRepo } from './uom/uom.repo'
import { initMaterialUomRoute } from './uom/uom.route'
import { UomService } from './uom/uom.service'

export class MaterialServiceModule {
	public readonly category: MaterialCategoryService
	public readonly uom: UomService
	public readonly location: MaterialLocationService
	public readonly master: MaterialService
	public readonly query: MaterialQueryService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		locationMaster: LocationMasterService,
	) {
		const materialCategoryRepo = new MaterialCategoryRepo(this.db)
		this.category = new MaterialCategoryService(materialCategoryRepo, this.cacheClient)

		const uomRepo = new UomRepo(this.db)
		this.uom = new UomService(uomRepo, this.cacheClient)

		const materialRepo = new MaterialRepo(this.db)
		const materialLocationRepo = new MaterialLocationRepo(this.db)

		this.master = new MaterialService(
			this.category,
			this.uom,
			locationMaster,
			materialRepo,
			this.cacheClient,
		)

		this.location = new MaterialLocationService(
			this.master,
			locationMaster,
			materialLocationRepo,
			this.cacheClient,
		)

		const materialQueryRepo = new MaterialQueryRepo(this.db)
		this.query = new MaterialQueryService(
			this.master,
			this.category,
			this.uom,
			locationMaster,
			materialQueryRepo,
		)
	}
}

export function initMaterialRouteModule(s: MaterialServiceModule) {
	return new Elysia({ prefix: '/material' })
		.use(initMaterialCategoryRoute(s.category))
		.use(initMaterialUomRoute(s.uom))
		.use(initMaterialLocationRoute(s.location))
		.use(initMaterialQueryRoute(s.query))
		.use(initMaterialMasterRoute(s.master))
}

export type { MaterialLocationService } from './material-location/material-location.service'
export type { MaterialCategoryService } from './material-category/material-category.service'
export type { MaterialService } from './material-master/material.service'
export type { MaterialQueryService } from './material-query/material-query.service'
export type { UomService } from './uom/uom.service'

export {
	MaterialCategoryDto,
	MaterialCategoryCreateDto,
	MaterialCategoryUpdateDto,
	MaterialCategoryFilterDto,
} from './material-category/material-category.dto'
export {
	MaterialLocationDto,
	MaterialLocationFilterDto,
	MaterialLocationAssignDto,
	MaterialLocationUnassignDto,
	MaterialLocationConfigDto,
	MaterialLocationWithLocationDto,
	MaterialLocationStockDto,
} from './material-location/material-location.dto'
export {
	MaterialDto,
	MaterialFilterDto,
	MaterialMutationDto,
	MaterialSelectDto,
	MaterialType,
	type MaterialType as MaterialTypeEnum,
} from './material-master/material.dto'
export { UomDto, UomFilterDto, UomMutationDto } from './uom/uom.dto'
