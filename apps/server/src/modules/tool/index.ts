import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { MaterialServiceModule } from '@/modules/material'
import type { ProductServiceModule } from '@/modules/product'

import { initSeedRoute } from './seed/seed.route'
import { SeedService } from './seed/seed.service'

export class ToolServiceModule {
	public readonly seed: SeedService

	constructor(
		private readonly db: DbClient,
		iamSvc: IamServiceModule,
		locationSvc: LocationServiceModule,
		productSvc: ProductServiceModule,
		materialSvc: MaterialServiceModule,
	) {
		this.seed = new SeedService(this.db, iamSvc, locationSvc, productSvc, materialSvc)
	}
}

export function initToolRouteModule(module: ToolServiceModule) {
	return new Elysia({ prefix: '/tool', detail: { tags: ['Tool'] } }).use(initSeedRoute(module.seed))
}

// Feature exports
export * from './seed/seed.dto'
export * from './seed/seed.service'
export * from './seed/seed.route'
