import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { LocationModule } from '@/modules/location'

import { MaterialCategoryRepo } from './category/category.repo'
import { MaterialCategoryService } from './category/category.service'
import { MaterialConversionRepo } from './conversion/conversion.repo'
import { MaterialConversionService } from './conversion/conversion.service'
import { MaterialLocationRepo } from './location/location.repo'
import { MaterialLocationService } from './location/location.service'
import { MaterialRepo } from './material.repo'
import { MaterialService } from './material.service'
import { MaterialQueryService } from './query/query.service'

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
