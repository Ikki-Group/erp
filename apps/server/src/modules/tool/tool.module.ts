import type { DbContext } from '@/infra/database'

import type { IamModule } from '@/modules/iam'
import type { LocationModule } from '@/modules/location'

import { SeedService } from './seed.service'

export interface ToolModule {
	seed: SeedService
}

interface Deps {
	iam: IamModule
	location: LocationModule
}

export function createToolModule(db: DbContext, deps: Deps): ToolModule {
	const seed = new SeedService(db, deps)
	return { seed }
}
