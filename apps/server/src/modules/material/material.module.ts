import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { LocationModule } from '@/modules/location'

import { MaterialCategoryRepo } from './repo/material-category.repo'
import { MaterialConversionRepo } from './repo/material-conversion.repo'
import { MaterialLocationRepo } from './repo/material-location.repo'
import { MaterialRepo } from './repo/material.repo'
import {
	initMaterialCategoryRoute,
	initMaterialConversionRoute,
	initMaterialLocationRoute,
	initMaterialMasterRoute,
	initMaterialQueryRoute,
} from './route'
import { MaterialCategoryService } from './service/material-category.service'
import { MaterialConversionService } from './service/material-conversion.service'
import { MaterialLocationService } from './service/material-location.service'
import { MaterialQueryService } from './service/material-query.service'
import { MaterialService } from './service/material.service'

interface MaterialModuleDeps {
	location: LocationModule
}

export interface MaterialModule {
	category: MaterialCategoryService
	conversion: MaterialConversionService
	master: MaterialService
	location: MaterialLocationService
	query: MaterialQueryService
}

export function createMaterialModule(
	db: DbClient,
	cacheClient: CacheClient,
	deps: MaterialModuleDeps,
): MaterialModule {
	const categoryRepo = new MaterialCategoryRepo(db)
	const category = new MaterialCategoryService({ repo: categoryRepo }, cacheClient)

	const conversionRepo = new MaterialConversionRepo(db)
	const conversion = new MaterialConversionService({ repo: conversionRepo, db }, cacheClient)

	const materialRepo = new MaterialRepo(db)
	const master = new MaterialService(
		{ category, conversion, repo: materialRepo, db },
		cacheClient,
	)

	const locationRepo = new MaterialLocationRepo(db)
	const location = new MaterialLocationService(
		{ master, location: deps.location, repo: locationRepo },
		cacheClient,
	)

	const query = new MaterialQueryService({
		master,
		category,
		location: deps.location,
		conversion,
		materialLocation: location,
	})

	return { category, conversion, master, location, query }
}

export function initMaterialRoutes(m: MaterialModule) {
	return new Elysia({ prefix: '/material' })
		.use(initMaterialCategoryRoute(m.category))
		.use(initMaterialConversionRoute(m.conversion))
		.use(initMaterialLocationRoute(m.location))
		.use(initMaterialQueryRoute(m.query))
		.use(initMaterialMasterRoute(m.master))
}
