import type { DbContext } from '@/infra/database/client.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { CachePort } from '@/shared/cache/cache.port.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { AnyElysia } from 'elysia'

export interface ModuleContext {
	db: DbContext
	uow: UnitOfWork
	cache: CachePort
	events: EventBusPort
	auditPort: AuditPort
}

export interface ModuleDescriptor {
	name: string
	layer: 0 | 1 | 2 | 3
	dependsOn: string[]
	create(ctx: ModuleContext, deps: Record<string, BuiltModule>): BuiltModule
}

export interface BuiltModule {
	route?: AnyElysia
	api?: Record<string, unknown>
}
