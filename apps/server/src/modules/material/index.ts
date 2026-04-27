import { Elysia } from 'elysia'

import type { LocationMasterService } from '@/modules/location'

import { initMaterialCategoryRoute } from './material-category/material-category.route'
import { MaterialCategoryService } from './material-category/material-category.service'
import { initMaterialLocationRoute } from './material-location/material-location.route'
import { MaterialLocationService } from './material-location/material-location.service'
import { initMaterialMasterRoute } from './material-master/material.route'
import { MaterialService } from './material-master/material.service'
import { initMaterialUomRoute } from './uom/uom.route'
import { UomService } from './uom/uom.service'

export class MaterialServiceModule {
	public category: MaterialCategoryService
	public uom: UomService
	public location: MaterialLocationService
	public master: MaterialService

	constructor(locationMaster: LocationMasterService) {
		this.category = new MaterialCategoryService()
		this.uom = new UomService()

		this.master = new MaterialService(this.category, this.uom, locationMaster)

		this.location = new MaterialLocationService(this.master, locationMaster)
	}
}

export function initMaterialRouteModule(s: MaterialServiceModule) {
	return new Elysia({ prefix: '/material' })
		.use(initMaterialCategoryRoute(s.category))
		.use(initMaterialUomRoute(s.uom))
		.use(initMaterialLocationRoute(s.location))
		.use(initMaterialMasterRoute(s.master))
}

export * from './material-category/material-category.dto'
export * from './material-category/material-category.repo'
export * from './material-category/material-category.service'

export * from './uom/uom.dto'
export * from './uom/uom.repo'
export * from './uom/uom.service'

export * from './material-location/material-location.dto'
export * from './material-location/material-location.repo'
export * from './material-location/material-location.service'

export * from './material-master/material.dto'
export * from './material-master/material.repo'
export * from './material-master/material.service'
