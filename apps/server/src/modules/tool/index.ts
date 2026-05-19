import { Elysia } from 'elysia'

import type { DbClient } from '@/infra/database'

import type { IamServiceModule } from '@/modules/iam'
import type { SalesTypeServiceModule } from '@/modules/sales-type'

import { initSeedRoute } from './seed.route'
import { SeedService } from './seed.service'

interface ToolServiceModuleDeps {
	iam: IamServiceModule
	salesType: SalesTypeServiceModule
}

export class ToolServiceModule {
	public readonly seed: SeedService

	constructor(
		private readonly db: DbClient,
		private readonly deps: ToolServiceModuleDeps,
	) {
		this.seed = new SeedService(
			this.db,
			this.deps.iam.role,
			this.deps.iam.user,
			this.deps.salesType.salesType,
		)
	}
}

export function initToolRouteModule(module: ToolServiceModule) {
	return new Elysia({ prefix: '/tool', detail: { tags: ['Tool'] } }).use(initSeedRoute(module.seed))
}

export type { SeedService } from './seed.service'
