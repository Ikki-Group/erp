import type { DbClient } from '@/infra/database'

import type { AccountService, GeneralLedgerModule } from '@/modules/finance'

import { MokaTransformationService } from './scrap-transformation.service'

export type MokaTransformationModule = MokaTransformationService

export interface MokaTransformationModuleDeps {
	account: AccountService
	journal: GeneralLedgerModule
}

export function createMokaTransformationModule(
	db: DbClient,
	deps: MokaTransformationModuleDeps,
): MokaTransformationModule {
	return new MokaTransformationService(db, deps.account, deps.journal)
}
