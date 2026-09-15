import { roles } from '@/db/schema/iam.ts'

import { eq } from '@/infra/database/index.ts'
import type { DbContext } from '@/infra/database/index.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import { auditEntryOf } from '@/shared/audit/audit.port.ts'
import { invalidateAuthCache } from '@/shared/auth/access-cache.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { OWNER_ROLE_CODE } from '@/shared/config/index.ts'
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import type {
	AssignmentCreateDto,
	AssignmentDto,
	AssignmentFilterDto,
	AssignmentRemoveDto,
} from './assignment.contract.ts'
import type { IAssignmentRepo } from './assignment.repo.ts'

// ─── Dependencies ───

export interface AssignmentDeps {
	locationService: LocationService
	uow: UnitOfWork
	audit: AuditPort
}

// ─── Service ───

export class AssignmentService {
	constructor(
		private readonly repo: IAssignmentRepo,
		private readonly deps: AssignmentDeps,
	) {}

	// ─── Reads ───

	async handleList(filter: AssignmentFilterDto): Promise<WithPaginationResult<AssignmentDto>> {
		return this.repo.findPage(filter)
	}

	async findByUserId(userId: number): Promise<AssignmentDto[]> {
		return this.repo.findByUserId(userId)
	}

	// ─── Mutations ───

	async handleAssign(data: AssignmentCreateDto, actor: Actor): Promise<EntityRef> {
		// 1. Validate locationId exists (if not null)
		if (data.locationId !== null) {
			const location = await this.deps.locationService.getById(data.locationId)
			if (!location) {
				throw new NotFoundError('Location not found', {
					code: 'LOCATION_NOT_FOUND',
					context: { locationId: data.locationId },
				})
			}
		}

		const result = await this.deps.uow.run(async (tx) => {
			// 2. Check duplicate assignment
			const existing = await this.repo.findExact(data.userId, data.roleId, data.locationId, tx)
			if (existing) {
				throw new ConflictError('Assignment already exists', {
					code: 'ASSIGNMENT_EXISTS',
					context: { userId: data.userId, roleId: data.roleId, locationId: data.locationId },
				})
			}

			// 3. Insert
			const written = await this.repo.insert(
				{
					userId: data.userId,
					roleId: data.roleId,
					locationId: data.locationId,
				},
				tx,
			)
			if (!written) {
				throw new BadRequestError('Assignment creation failed', {
					code: 'ASSIGNMENT_CREATE_FAILED',
				})
			}

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'user_assignment',
					entityId: written.id,
					action: 'create',
					summary: `Assigned user ${data.userId} to role ${data.roleId} at location ${data.locationId ?? 'global'}`,
					newValues: { userId: data.userId, roleId: data.roleId, locationId: data.locationId },
				}),
				tx,
			)
			return written
		})

		await invalidateAuthCache(data.userId)
		return result
	}

	async handleRemove(data: AssignmentRemoveDto, actor: Actor): Promise<EntityRef> {
		const result = await this.deps.uow.run(async (tx) => {
			// 1. Find the exact assignment
			const existing = await this.repo.findExact(data.userId, data.roleId, data.locationId, tx)
			if (!existing) {
				throw new NotFoundError('Assignment not found', {
					code: 'ASSIGNMENT_NOT_FOUND',
					context: { userId: data.userId, roleId: data.roleId, locationId: data.locationId },
				})
			}

			// 2. Block removal of last owner assignment
			await this.#guardLastOwner(data.roleId, tx)

			// 3. Hard delete
			const written = await this.repo.remove(existing.id, tx)
			if (!written) {
				throw new BadRequestError('Assignment removal failed', { code: 'ASSIGNMENT_REMOVE_FAILED' })
			}

			await this.deps.audit.record(
				auditEntryOf(actor, {
					module: 'iam',
					entity: 'user_assignment',
					entityId: existing.id,
					action: 'delete',
					summary: `Removed user ${data.userId} from role ${data.roleId} at location ${data.locationId ?? 'global'}`,
				}),
				tx,
			)
			return written
		})

		await invalidateAuthCache(data.userId)
		return result
	}

	// ─── Private ───

	async #guardLastOwner(roleId: number, tx: DbContext): Promise<void> {
		// Look up the role code for this roleId
		const [role] = await tx
			.select({ code: roles.code })
			.from(roles)
			.where(eq(roles.id, roleId))
			.limit(1)

		if (!role || role.code !== OWNER_ROLE_CODE) return

		// This is an owner role — check if it's the last one
		const ownerCount = await this.repo.countOwnerAssignments(tx)
		if (ownerCount <= 1) {
			throw new BadRequestError('Cannot remove the last owner assignment', {
				code: 'LAST_OWNER_ASSIGNMENT',
			})
		}
	}
}
