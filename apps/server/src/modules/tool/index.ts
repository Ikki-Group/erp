import type { DbClient } from '@/core/database'

import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { MaterialServiceModule } from '@/modules/material'
import type { ProductServiceModule } from '@/modules/product'

import { SeedService } from './service/seed.service'

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

export * from './router'
export * from './service'
