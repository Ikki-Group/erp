import type { AuthContext } from '@/shared/auth/permission.ts'
import type { Infra } from '@/shared/module.ts'

import type { SummaryRepo } from './summary.repo.ts'
import type { InventoryLocationSummaryDto } from '@ikki/contract/inventory/summary'

interface Deps extends Infra {
	repo: SummaryRepo
}

export class SummaryService {
	constructor(private readonly deps: Deps) {}

	/** Global stock readers see every active location; others only where they can read stock. */
	handleSummary(auth: AuthContext): Promise<InventoryLocationSummaryDto[]> {
		return this.deps.repo.findByLocations(auth.allowedLocations())
	}
}
