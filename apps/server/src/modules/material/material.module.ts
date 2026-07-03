/**
 * Material Module — DI Container
 *
 * Single entry point for wiring all material sub-services.
 * Dependencies are initialized in dependency order.
 */

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

/* ----------------------------- MODULE DEPS -------------------------------- */

interface MaterialModuleDeps {
	location: LocationModule
}

/* ----------------------------- MODULE CLASS -------------------------------- */

export class MaterialModule {
	public readonly category: MaterialCategoryService
	public readonly conversion: MaterialConversionService
	public readonly master: MaterialService
	public readonly location: MaterialLocationService
	public readonly query: MaterialQueryService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: MaterialModuleDeps,
	) {
		// Layer 1 — Base services (no cross-dependencies)
		const categoryRepo = new MaterialCategoryRepo(this.db)
		this.category = new MaterialCategoryService({ repo: categoryRepo }, this.cacheClient)

		// Layer 2 — Conversion (depends on db for transactions)
		const conversionRepo = new MaterialConversionRepo(this.db)
		this.conversion = new MaterialConversionService(
			{ repo: conversionRepo, db: this.db },
			this.cacheClient,
		)

		// Layer 3 — Master (depends on category + conversion)
		const materialRepo = new MaterialRepo(this.db)
		this.master = new MaterialService(
			{
				category: this.category,
				conversion: this.conversion,
				repo: materialRepo,
				db: this.db,
			},
			this.cacheClient,
		)

		// Layer 4 — Location (depends on master + external location)
		const locationRepo = new MaterialLocationRepo(this.db)
		this.location = new MaterialLocationService(
			{
				master: this.master,
				location: this.deps.location,
				repo: locationRepo,
			},
			this.cacheClient,
		)

		// Layer 5 — Query (read-only, depends on multiple services)
		this.query = new MaterialQueryService({
			master: this.master,
			category: this.category,
			location: this.deps.location,
			conversion: this.conversion,
			materialLocation: this.location,
		})
	}
}

/* ----------------------------- ROUTE INIT --------------------------------- */

export function initMaterialRoutes(m: MaterialModule) {
	return new Elysia({ prefix: '/material' })
		.use(initMaterialCategoryRoute(m.category))
		.use(initMaterialConversionRoute(m.conversion))
		.use(initMaterialLocationRoute(m.location))
		.use(initMaterialQueryRoute(m.query))
		.use(initMaterialMasterRoute(m.master))
}
