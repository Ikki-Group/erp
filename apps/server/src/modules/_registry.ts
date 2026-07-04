import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { createAuthModule, type AuthModule } from '@/modules/auth'
import { type IamModule, createIamModule } from '@/modules/iam/iam.module'
import { type LocationModule, createLocationModule } from '@/modules/location/location.module'
import { createSalesTypeModule, type SalesTypeModule } from '@/modules/sales-type'
import { createSessionModule, type SessionModule } from '@/modules/session'
import { createSupplierModule, type SupplierModule } from '@/modules/supplier'
import type { ToolModule } from '@/modules/tool'
import { createToolModule } from '@/modules/tool/tool.module'

export interface Modules {
	location: LocationModule
	salesType: SalesTypeModule
	iam: IamModule
	session: SessionModule
	auth: AuthModule
	tool: ToolModule
	supplier: SupplierModule
}

export function createModules(db: DbContext, cacheClient: CacheClient): Modules {
	const session = createSessionModule(db, cacheClient)
	const location = createLocationModule(db, cacheClient)
	const salesType = createSalesTypeModule(db, cacheClient)
	const supplier = createSupplierModule(db, cacheClient)
	const iam = createIamModule(db, cacheClient, { location })
	const auth = createAuthModule(db, cacheClient, { iam, session })
	const tool = createToolModule(db, { iam, location })

	return {
		location,
		salesType,
		iam,
		session,
		auth,
		tool,
		supplier,
	}
}
