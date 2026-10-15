import cors from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { auditPort } from './infra/audit/audit.drizzle.ts'
import { cache as cacheClient, cachePort } from './infra/cache/index.ts'
import { pool } from './infra/database/client.ts'
import { db, uow } from './infra/database/index.ts'
import { otelPlugin } from './infra/otel/otel.ts'
import { sessionStore } from './infra/session/index.ts'
import { auditModule } from './modules/audit/index.ts'
import { authModule } from './modules/auth/index.ts'
import { companyModule } from './modules/company/index.ts'
import { iamModule } from './modules/iam/index.ts'
import { inventoryModule } from './modules/inventory/index.ts'
import { locationModule } from './modules/location/index.ts'
import { materialModule } from './modules/material/index.ts'
import { menuModule } from './modules/menu/index.ts'
import { paymentMethodModule } from './modules/payment-method/index.ts'
import { posModule } from './modules/pos/index.ts'
import { productionModule } from './modules/production/index.ts'
import { recipeModule } from './modules/recipe/index.ts'
import { supplierModule } from './modules/supplier/index.ts'
import { uomModule } from './modules/uom/index.ts'
import { openapiPlugin } from './server/openapi.ts'
import { errorPlugin } from './server/plugins/error.plugin.ts'
import { env } from './shared/config/env.ts'
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
	authModule,
	inventoryModule,
	posModule,
	productionModule,
]
const modules = composeModules(ALL_MODULE_DESCRIPTORS, ctx)

// ─── Readiness ───

const READY_TIMEOUT_MS = 2000

async function isDatabaseReady(): Promise<boolean> {
	let timer: ReturnType<typeof setTimeout> | undefined
	const timeout = new Promise<false>((resolve) => {
		timer = setTimeout(() => resolve(false), READY_TIMEOUT_MS)
	})
	try {
		const ping = pool.query('select 1').then(
			() => true,
			() => false,
		)
		return await Promise.race([ping, timeout])
	} finally {
		clearTimeout(timer)
	}
}

// ─── App ───

const base = new Elysia({ normalize: true, encodeSchema: true })

if (otelPlugin) base.use(otelPlugin)

let composedApp: AnyElysia = base
	.use(errorPlugin)
	.use(openapiPlugin)
	.get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }), {
		detail: { hide: true },
	})
	.get(
		'/ready',
		async ({ set }) => {
			if (await isDatabaseReady()) return { status: 'ready' }
			set.status = 503
			return { status: 'unavailable' }
		},
		{ detail: { hide: true } },
	)

for (const module of modules.values()) {
	if (module.route) composedApp = composedApp.use(module.route)
}

// Apply CORS after module composition so it covers every final route.
composedApp = composedApp.use(
	cors({
		origin: env.CORS_ORIGINS.includes('*') ? '*' : env.CORS_ORIGINS,
		credentials: false,
	}).as('global'),
)

export const app = composedApp
