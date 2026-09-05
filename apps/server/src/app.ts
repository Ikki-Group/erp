import cors from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import z from 'zod'

import { auditPort } from './infra/audit/audit.drizzle.ts'
import { cache as cachePort } from './infra/cache/cache.memory.ts'
import { db, uow } from './infra/database/index.ts'
import { createMemoryEventBus } from './infra/events/event-bus.memory.ts'
import { otelPlugin } from './infra/otel/otel.ts'
import { auditModule } from './modules/audit/index.ts'
import { companyModule } from './modules/company/index.ts'
import { legacyModule } from './modules/legacy.module.ts'
import { errorPlugin } from './server/plugins/error.plugin.ts'
import { isDev } from './shared/config/env.ts'
import { composeModules } from './shared/module/compose.ts'
import type { ModuleContext, ModuleDescriptor } from './shared/module/registry.ts'
import type { AnyElysia } from 'elysia'

// ─── Module Registry ───

const ctx: ModuleContext = {
	db,
	uow,
	cache: cachePort,
	events: createMemoryEventBus(),
	auditPort,
}

const ALL_MODULE_DESCRIPTORS: ModuleDescriptor[] = [auditModule, companyModule, legacyModule]
const modules = composeModules(ALL_MODULE_DESCRIPTORS, ctx)

// ─── App ───

const base = new Elysia({ normalize: true, encodeSchema: true })
	.use(cors())
	.onParse(({ request, contentType }) => {
		if (contentType === 'application/custom-type') return request.text()
		return undefined
	})

if (otelPlugin) base.use(otelPlugin)

let composedApp: AnyElysia = base
	.use(errorPlugin)
	.use(
		openapi({
			enabled: isDev,
			path: '/openapi',
			documentation: {
				info: {
					title: 'Ikki ERP API',
					version: '1.0.0',
					description: 'API documentation for Ikki ERP server',
				},
			},
			mapJsonSchema: {
				// oxlint-disable-next-line typescript/consistent-return
				zod: (schema: any) => {
					return z.toJSONSchema(schema, {
						unrepresentable: 'any',
						override(ctx) {
							// oxlint-disable-next-line no-underscore-dangle
							const def = ctx.zodSchema._zod.def
							if (def.type === 'date') {
								ctx.jsonSchema.type = 'string'
								ctx.jsonSchema.format = 'date-time'
								ctx.jsonSchema.examples = ['2026-08-09T06:06:00Z']
							}

							return ctx
						},
					})
				},
			},
		}).as('global'),
	)
	.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }), {
		detail: { hide: true },
	})

for (const module of modules.values()) {
	if (module.route) composedApp = composedApp.use(module.route)
}

export const app = composedApp
