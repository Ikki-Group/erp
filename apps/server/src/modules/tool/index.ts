import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { MaterialServiceModule } from '@/modules/material'
import type { SalesServiceModule } from '@/modules/sales'

interface ToolServiceModuleDeps {
	iam: IamServiceModule
	location: LocationServiceModule
	material: MaterialServiceModule
	sales: SalesServiceModule
}

import { initSeedRoute } from './seed/seed.route'
import { SeedService } from './seed/seed.service'

export class ToolServiceModule {
	public readonly seed: SeedService

	constructor(
		private readonly db: DbClient,
		private readonly deps: ToolServiceModuleDeps,
	) {
		this.seed = new SeedService(
			this.db,
			this.deps.iam,
			this.deps.location,
			this.deps.material,
			this.deps.sales,
		)
	}
}

export function initToolRouteModule(module: ToolServiceModule) {
	return new Elysia({ prefix: '/tool', detail: { tags: ['Tool'] } }).use(initSeedRoute(module.seed))
}

export * from './seed/seed.dto'
export type { SeedService } from './seed/seed.service'
