import type { Tx } from '@/infra/database/client.ts'
import type { AuditEntryInput, AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

// ─── Types ───

/** Anything exposing the standard list/count/byId invalidation (e.g. `CacheService`). */
interface StandardInvalidatable {
	invalidateStandard(id?: number): Promise<void>
}

/** Post-commit invalidation: a cache invalidated by the written id, or a custom callback. */
export type Invalidation = StandardInvalidatable | ((ref: EntityRef) => Promise<void>)

/** Per-entity mutation wiring, usually built once in a service constructor. */
export interface MutationScope {
	uow: UnitOfWork
	audit: AuditPort
	module: string
	entity: string
	/** Run in order after commit, unless a call passes its own `invalidate`. */
	invalidate?: Invalidation | readonly Invalidation[]
}

export interface MutationOutcome<T extends EntityRef> {
	result: T
	/** Audit fields beyond the scope; `entityId` defaults to `result.id`. */
	audit: Omit<AuditEntryInput, 'module' | 'entity' | 'entityId'> & { entityId?: number }
}

// ─── Mutate ───

/**
 * Runs `work` in one transaction, records its audit entry inside that transaction, then
 * invalidates caches after commit.
 *
 * `work` MUST be re-runnable: the UoW may retry the whole transaction (deadlock/serialization
 * failure), so keep external side effects (cache, events) out of it.
 */
export async function mutate<T extends EntityRef>(
	scope: MutationScope,
	actor: Actor,
	work: (tx: Tx) => Promise<MutationOutcome<T>>,
	options: { invalidate?: Invalidation | readonly Invalidation[] } = {},
): Promise<T> {
	const result = await scope.uow.run(async (tx) => {
		const { result, audit } = await work(tx)
		await scope.audit.record(
			auditEntryOf(actor, {
				...audit,
				module: scope.module,
				entity: scope.entity,
				entityId: audit.entityId ?? result.id,
			}),
			tx,
		)
		return result
	})

	const targets: readonly Invalidation[] = [options.invalidate ?? scope.invalidate ?? []].flat()
	for (const target of targets) {
		await (typeof target === 'function' ? target(result) : target.invalidateStandard(result.id))
	}
	return result
}
