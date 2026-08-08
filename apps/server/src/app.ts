import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { cache } from './infra/cache/index.ts'
import { db } from './infra/database/index.ts'
import { sessionStore } from './infra/session/index.ts'
import { createAuthModule } from './modules/auth/index.ts'
import { createCompanyModule } from './modules/company/index.ts'
import { createIamModule } from './modules/iam/index.ts'
import { createLocationModule } from './modules/location/index.ts'
import { createUomModule } from './modules/uom/index.ts'
import { errorPlugin } from './server/plugins/error.plugin.ts'

// ─── Modules ───

const location = createLocationModule(db, cache)
const company = createCompanyModule(db, cache)
const uom = createUomModule(db, cache)
const iam = createIamModule(db, cache, { locationService: location.service })
const auth = createAuthModule({
	userRepo: iam.userRepo,
	assignmentService: iam.assignmentService,
	locationService: location.service,
	sessionStore,
})

// ─── App ───

export const app = new Elysia()
	.use(cors())
	.use(errorPlugin)
	.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
	.use(auth.route)
	.use(company.route)
	.use(location.route)
	.use(iam.route)
	.use(uom.route)
