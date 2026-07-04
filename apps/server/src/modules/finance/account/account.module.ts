import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { AccountRepo } from './account.repo'
import { AccountService } from './account.service'

export type AccountModule = AccountService

export function createAccountModule(db: DbContext, cacheClient: CacheClient): AccountModule {
	const repo = new AccountRepo(db)
	const account = new AccountService(repo, cacheClient)
	return account
}
