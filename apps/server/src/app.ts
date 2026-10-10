import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { audit } from './infra/audit.ts'
import { db, uow } from './infra/database/index.ts'
import { otelPlugin } from './infra/otel/otel.ts'
import { createModules } from './modules/index.ts'
import { openapiPlugin } from './server/openapi.ts'
import { errorPlugin } from './server/plugins/error.plugin.ts'
import { env } from './shared/config/env.ts'
import type { AnyElysia } from 'elysia'

let app: AnyElysia = new Elysia({ normalize: true, encodeSchema: true })
if (otelPlugin) app = app.use(otelPlugin)

app = app
	.use(cors({ origin: env.CORS_ORIGINS, credentials: false }))
	.use(errorPlugin)
	.use(openapiPlugin)
	.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }), {
		detail: { hide: true },
	})

for (const route of createModules({ db, uow, audit })) app = app.use(route)

export { app }
