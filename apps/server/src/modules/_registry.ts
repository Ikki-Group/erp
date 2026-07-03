import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { createAuthModule, type AuthModule } from '@/modules/auth'
import { type IamModule, createIamModule } from '@/modules/iam/iam.module'
import { type LocationModule, createLocationModule } from '@/modules/location/location.module'
import { createSessionModule, type SessionModule } from '@/modules/session'
import type { ToolModule } from '@/modules/tool'
import { createToolModule } from '@/modules/tool/tool.module'

export interface Modules {
	location: LocationModule
	iam: IamModule
	session: SessionModule
	auth: AuthModule
	tool: ToolModule
}

/**
 * Composition root — the single place where the whole module graph is wired.
 *
 * This is intentionally a plain, explicit factory (no DI container / magic):
 * each `create*Module` receives exactly the dependencies it needs. Because
 * dependencies are constructor args, the declaration order below is a manual
 * topological sort — a module must be created AFTER everything it depends on:
 *
 *   Layer 0 (core):    session
 *   Layer 1 (master):  location  →  iam (needs location)
 *   Layer 0 (core):    auth (needs iam + session)
 *   Tooling:           tool (needs iam + location)
 *
 * When adding a module: create it below in dependency order, add it to the
 * returned object, and add its field to the `Modules` interface above. If it
 * has HTTP routes, also register it in `_routes.ts`.
 */
export function createModules(db: DbContext, cacheClient: CacheClient): Modules {
	const session = createSessionModule(db, cacheClient)
	const location = createLocationModule(db, cacheClient)
	const iam = createIamModule(db, cacheClient, { location })
	const auth = createAuthModule(db, cacheClient, { iam, session })
	const tool = createToolModule(db, { iam, location })

	return {
		location,
		iam,
		session,
		auth,
		tool,
	}
}
