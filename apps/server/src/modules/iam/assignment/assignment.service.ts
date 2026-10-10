import type { Tx } from '@/infra/database/index.ts'
import { invalidateUserAccess } from '@/server/auth/access.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { OWNER_ROLE_CODE } from '@/shared/config/index.ts'
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { Infra } from '@/shared/module.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { LocationService } from '@/modules/location/index.ts'

import type {
	AssignmentCreateDto,
	AssignmentDto,
	AssignmentFilterDto,
	AssignmentRemoveDto,
} from '@ikki/contract/iam/assignment'
import type { AssignmentRepo } from './assignment.repo.ts'

interface Deps extends Infra {
	repo: AssignmentRepo
	location: Pick<LocationService, 'getById'>
}

const AUDIT = { module: 'iam', entity: 'user_assignment' } as const

export class AssignmentService {
	constructor(private readonly deps: Deps) {}

	handleList(filter: AssignmentFilterDto): Promise<WithPaginationResult<AssignmentDto>> {
		return this.deps.repo.findPage(filter)
	}

	async handleAssign(data: AssignmentCreateDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit, location } = this.deps
		if (data.locationId !== null && !(await location.getById(data.locationId))) {
			throw new NotFoundError('Location not found', {
				code: 'LOCATION_NOT_FOUND',
				context: { locationId: data.locationId },
			})
		}

		const result = await uow.run(async (tx) => {
			// Serialize per user so the scope invariant holds under concurrent admins.
			await repo.lockUser(data.userId, tx)
			if (!(await repo.userExists(data.userId, tx))) {
				throw new NotFoundError('User not found', {
					code: 'USER_NOT_FOUND',
					context: { userId: data.userId },
				})
			}

			// Owner access is global by definition.
			const roleCode = await repo.findRoleCode(data.roleId, tx)
			if (roleCode === undefined) {
				throw new NotFoundError('Role not found', {
					code: 'ROLE_NOT_FOUND',
					context: { roleId: data.roleId },
				})
			}
			if (roleCode === OWNER_ROLE_CODE && data.locationId !== null) {
				throw new BadRequestError('Owner assignment must be global', {
					code: 'OWNER_ASSIGNMENT_MUST_BE_GLOBAL',
					context: { roleId: data.roleId, locationId: data.locationId },
				})
			}

			// A user is either global or location-scoped; mixing makes permissions ambiguous.
			const current = await repo.findByUserId(data.userId, tx)
			const hasGlobal = current.some((a) => a.locationId === null)
			const hasLocation = current.some((a) => a.locationId !== null)
			if ((data.locationId === null && hasLocation) || (data.locationId !== null && hasGlobal)) {
				throw new ConflictError('Global and location-specific assignments cannot be mixed', {
					code: 'ASSIGNMENT_SCOPE_CONFLICT',
					context: { userId: data.userId, locationId: data.locationId },
				})
			}

			// A location may only appear once for a user, regardless of role.
			if (data.locationId !== null && current.some((a) => a.locationId === data.locationId)) {
				throw new ConflictError('Location is already assigned to this user', {
					code: 'ASSIGNMENT_LOCATION_EXISTS',
					context: { userId: data.userId, locationId: data.locationId },
				})
			}

			if (await repo.findExact(data.userId, data.roleId, data.locationId, tx)) {
				throw new ConflictError('Assignment already exists', {
					code: 'ASSIGNMENT_EXISTS',
					context: { userId: data.userId, roleId: data.roleId, locationId: data.locationId },
				})
			}

			const written = await repo.insert(
				{ userId: data.userId, roleId: data.roleId, locationId: data.locationId },
				tx,
			)
			if (!written) {
				throw new BadRequestError('Assignment creation failed', {
					code: 'ASSIGNMENT_CREATE_FAILED',
				})
			}
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: written.id,
				action: 'create',
				summary: `Assigned user ${data.userId} to role ${data.roleId} at location ${data.locationId ?? 'global'}`,
				newValues: { userId: data.userId, roleId: data.roleId, locationId: data.locationId },
			})
			return written
		})
		await invalidateUserAccess(data.userId)
		return result
	}

	async handleRemove(data: AssignmentRemoveDto, actor: Actor): Promise<EntityRef> {
		const { repo, uow, audit } = this.deps
		const result = await uow.run(async (tx) => {
			const existing = await repo.findExact(data.userId, data.roleId, data.locationId, tx)
			if (!existing) {
				throw new NotFoundError('Assignment not found', {
					code: 'ASSIGNMENT_NOT_FOUND',
					context: { userId: data.userId, roleId: data.roleId, locationId: data.locationId },
				})
			}
			await this.#guardLastOwner(data.roleId, tx)
			const written = await repo.remove(existing.id, tx)
			if (!written) {
				throw new BadRequestError('Assignment removal failed', { code: 'ASSIGNMENT_REMOVE_FAILED' })
			}
			await audit.record(tx, actor, {
				...AUDIT,
				entityId: existing.id,
				action: 'delete',
				summary: `Removed user ${data.userId} from role ${data.roleId} at location ${data.locationId ?? 'global'}`,
			})
			return written
		})
		await invalidateUserAccess(data.userId)
		return result
	}

	async #guardLastOwner(roleId: number, tx: Tx): Promise<void> {
		const { repo } = this.deps
		if ((await repo.findRoleCode(roleId, tx)) !== OWNER_ROLE_CODE) return
		if ((await repo.countOwnerAssignments(tx)) <= 1) {
			throw new BadRequestError('Cannot remove the last owner assignment', {
				code: 'LAST_OWNER_ASSIGNMENT',
			})
		}
	}
}
