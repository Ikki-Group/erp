import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { RoleService } from '@/modules/iam'
import type { UserService } from '@/modules/iam'
import type { LocationMasterService } from '@/modules/location'
import type { MaterialCategoryService } from '@/modules/material'
import type { MaterialService } from '@/modules/material'
import type { UomService } from '@/modules/material'
import type { SalesTypeService } from '@/modules/sales'

interface ToolServiceModuleDeps {
	iamRole: RoleService
	iamUser: UserService
	locationMaster: LocationMasterService
	materialCategory: MaterialCategoryService
	materialMaster: MaterialService
	materialUom: UomService
	salesType: SalesTypeService
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
			this.deps.iamRole,
			this.deps.iamUser,
			this.deps.locationMaster,
			this.deps.materialCategory,
			this.deps.materialMaster,
			this.deps.materialUom,
			this.deps.salesType,
		)
	}
}

export function initToolRouteModule(module: ToolServiceModule) {
	return new Elysia({ prefix: '/tool', detail: { tags: ['Tool'] } }).use(initSeedRoute(module.seed))
}

export * from './seed/seed.dto'
export type { SeedService } from './seed/seed.service'
