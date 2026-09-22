import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { auditPort } from './infra/audit/audit.drizzle.ts'
import { cache as cachePort } from './infra/cache/cache.memory.ts'
import { cache as cacheClient } from './infra/cache/index.ts'
import { db, uow } from './infra/database/index.ts'
import { createMemoryEventBus } from './infra/events/event-bus.memory.ts'
import { otelPlugin } from './infra/otel/otel.ts'
import { sessionStore } from './infra/session/index.ts'
import { auditModule } from './modules/audit/index.ts'
import { companyModule } from './modules/company/index.ts'
import { iamModule } from './modules/iam/index.ts'
import { legacyModule } from './modules/legacy.module.ts'
import { locationModule } from './modules/location/index.ts'
import { materialModule } from './modules/material/index.ts'
import { menuModule } from './modules/menu/index.ts'
import { paymentMethodModule } from './modules/payment-method/index.ts'
import { recipeModule } from './modules/recipe/index.ts'
import { supplierModule } from './modules/supplier/index.ts'
import { uomModule } from './modules/uom/index.ts'
import { openapiPlugin } from './server/openapi.ts'
import { errorPlugin } from './server/plugins/error.plugin.ts'
import { composeModules } from './shared/module/compose.ts'
import type { ModuleContext, ModuleDescriptor } from './shared/module/registry.ts'
import type { AnyElysia } from 'elysia'

// ─── Module Registry ───

const ctx: ModuleContext = {
	db,
	uow,
	cache: cachePort,
	cacheClient,
	sessionStore,
	events: createMemoryEventBus(),
	auditPort,
}

const ALL_MODULE_DESCRIPTORS: ModuleDescriptor[] = [
	auditModule,
	companyModule,
	locationModule,
	uomModule,
	iamModule,
	materialModule,
	supplierModule,
	paymentMethodModule,
	menuModule,
	recipeModule,
	legacyModule,
]
const modules = composeModules(ALL_MODULE_DESCRIPTORS, ctx)

// ─── App ───

const base = new Elysia({ normalize: true, encodeSchema: true })

if (otelPlugin) base.use(otelPlugin)

let composedApp: AnyElysia = base
	.use(errorPlugin)
	.use(openapiPlugin)
	.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }), {
		detail: { hide: true },
	})

for (const module of modules.values()) {
	if (module.route) composedApp = composedApp.use(module.route)
}

// Apply CORS after module composition so it covers every final route.
composedApp = composedApp.use(cors({ origin: '*', credentials: false }).as('global'))

export const app = composedApp
