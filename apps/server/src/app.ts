import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { cache } from './infra/cache/index.ts'
import { db } from './infra/database/index.ts'
import { createIamModule } from './modules/iam/index.ts'
import { createLocationModule } from './modules/location/index.ts'
import { errorPlugin } from './server/plugins/error.plugin.ts'

// ─── Modules ───

const location = createLocationModule(db, cache)
const iam = createIamModule(db, cache, { locationService: location.service })

// ─── App ───

export const app = new Elysia()
	.use(cors())
	.use(errorPlugin)
	.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
	.use(location.route)
	.use(iam.route)
