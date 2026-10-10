import { roles } from '@/db/schema/iam.ts'

import { checkConflict } from '@/infra/database/conflict.ts'
import { invalidateRoleAccess } from '@/server/auth/access.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from '@ikki/contract/iam/role'
import { RoleError, uniqueFields } from './role.internal.ts'
import type { RoleRepo } from './role.repo.ts'

interface Deps extends Infra {
	repo: RoleRepo
}

const AUDIT = { module: 'iam', entity: 'role' } as const

export class RoleService {
	constructor(private readonly deps: Deps) {}

	async handleGetById(id: number): Promise<RoleDto> {
		const role = await this.deps.repo.findById(id)
		if (!role) throw RoleError.notFound(id)
		return role
	}

	handleList(filter: RoleFilterDto): Promise<WithPaginationResult<RoleDto>> {
		return this.deps.repo.findPage(filter)
	}

	handleCreate(data: RoleCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			await checkConflict({
				db: tx,
				table: roles,
				pkColumn: roles.id,
				fields: uniqueFields,
				input: data,
			})
			const written = await repo.insert({ ...data, isSystem: false, ...stampCreate(actor.id) }, tx)
			if (!written) throw RoleError.createFailed()
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Created role "${data.name}" (${data.code})`,
				newValues: {
					code: data.code,
					name: data.name,
					description: data.description,
					permissions: data.permissions,
				},
			})
			return written
		})
	}

	async handleUpdate(data: RoleUpdateDto, actor: Actor): Promise<EntityRef> {
		const { id, ...changes } = data
		const { repo, uow, audit } = this.deps
		const result = await uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw RoleError.notFound(id)
			if (existing.isSystem) throw RoleError.systemRoleImmutable()
			await checkConflict({
				db: tx,
				table: roles,
				pkColumn: roles.id,
				fields: uniqueFields,
				input: changes,
				excludeId: id,
			})
			const written = await repo.update(id, { ...changes, ...stampUpdate(actor.id) }, tx)
			if (!written) throw RoleError.updateFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'update',
				summary: `Updated role "${data.name}" (${data.code})`,
				oldValues: {
					code: existing.code,
					name: existing.name,
					description: existing.description,
					permissions: existing.permissions,
				},
				newValues: {
					code: data.code,
					name: data.name,
					description: data.description,
					permissions: data.permissions,
				},
			})
			return written
		})
		await invalidateRoleAccess(id)
		return result
	}

	/** Deleting is blocked while the role is assigned, so no holder's access can be stale. */
	handleDelete(id: number, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		return uow.run(async (tx) => {
			const existing = await repo.findById(id, tx)
			if (!existing) throw RoleError.notFound(id)
			if (existing.isSystem) throw RoleError.systemRoleImmutable()
			if ((await repo.countAssignments(id, tx)) > 0) throw RoleError.assignedRole(id)
			const written = await repo.remove(id, tx)
			if (!written) throw RoleError.deleteFailed(id)
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: id,
				action: 'delete',
				summary: `Deleted role "${existing.name}" (${existing.code})`,
			})
			return written
		})
	}
}
