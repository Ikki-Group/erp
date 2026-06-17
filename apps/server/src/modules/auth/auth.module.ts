import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { AuthService } from '@/modules/auth/auth.service'
import type { IamModule } from '@/modules/iam'
import type { SessionModule } from '@/modules/session'

interface Deps {
	session: SessionModule
	iam: IamModule
}

export type AuthModule = AuthService

export function createAuthModule(
	_db: DbContext,
	_cacheClient: CacheClient,
	deps: Deps,
): AuthModule {
	return new AuthService(deps.iam, deps.session)
}
