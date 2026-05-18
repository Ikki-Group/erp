import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'

import type { DbClient } from '@/infra/database'

import { MaterialCategoryRepo } from '@/modules/material/material-category.repo'
import { createMaterialCategoryRoute } from '@/modules/material/material-category.route'
import { MaterialCategoryService } from '@/modules/material/material-category.service'
import { MaterialUomRepo } from '@/modules/material/material-uom.repo'
import { createMaterialUomRoute } from '@/modules/material/material-uom.route'
import { MaterialUomService } from '@/modules/material/material-uom.service'

interface Deps {}

export class MaterialServiceModule {
	public readonly category: MaterialCategoryService
	public readonly uom: MaterialUomService

	constructor(
		private readonly deps: Deps,
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const categoryRepo = new MaterialCategoryRepo(this.db)
		const uomRepo = new MaterialUomRepo(this.db)

		this.category = new MaterialCategoryService(categoryRepo, this.cacheClient)
		this.uom = new MaterialUomService(uomRepo, this.cacheClient)
	}
}

export function createMaterialRouteModule(s: MaterialServiceModule) {
	return new Elysia({ prefix: '/material' })
		.use(createMaterialCategoryRoute(s.category))
		.use(createMaterialUomRoute(s.uom))
}
