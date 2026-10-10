import type { AuthContext } from '@/shared/auth/permission.ts'
import type { Infra } from '@/shared/module.ts'

import type { SummaryRepo } from './summary.repo.ts'
import type { InventoryLocationSummaryDto } from '@ikki/contract/inventory/summary'

interface Deps extends Infra {
	repo: SummaryRepo
}

const READ_PERMISSION = 'stock.read'

export class SummaryService {
	constructor(private readonly deps: Deps) {}

	/** Owner / global stock readers see every active location; others only the locations they can read stock at. */
	async handleSummary(auth: AuthContext): Promise<InventoryLocationSummaryDto[]> {
		const global = auth.isOwner || auth.globalPermissions.includes(READ_PERMISSION)
		const ids = global
			? null
			: Object.entries(auth.access)
					.filter(([, permissions]) => permissions.includes(READ_PERMISSION))
					.map(([id]) => Number(id))
		return this.deps.repo.findByLocations(ids)
	}
}
