import type { IamModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { MaterialServiceModule } from '@/modules/material'
import type { ProductServiceModule } from '@/modules/product'

import { SeedService } from './seed.service'

export class ToolServiceModule {
	public readonly seed: SeedService

	constructor(
		iamSvc: IamModule,
		locationSvc: LocationServiceModule,
		productSvc: ProductServiceModule,
		materialSvc: MaterialServiceModule,
	) {
		this.seed = new SeedService(iamSvc, locationSvc, productSvc, materialSvc)
	}
}
