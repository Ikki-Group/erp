import { roles } from '@/db/schema/iam.ts'

import { auditLog } from '@/infra/audit/index.ts'
import { eq } from '@/infra/database/index.ts'
import { OWNER_ROLE_CODE } from '@/shared/config/index.ts'
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors/http-error.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { ActorId, EntityRef } from '@/shared/types/utils.ts'

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

	async handleAssign(data: AssignmentCreateDto, actorId: ActorId): Promise<EntityRef> {
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

		// 2. Check duplicate assignment
		const existing = await this.repo.findExact(data.userId, data.roleId, data.locationId)
		if (existing) {
			throw new ConflictError('Assignment already exists', {
				code: 'ASSIGNMENT_EXISTS',
				context: { userId: data.userId, roleId: data.roleId, locationId: data.locationId },
			})
		}

		// 3. Insert
		const result = await this.repo.insert({
			userId: data.userId,
			roleId: data.roleId,
			locationId: data.locationId,
		})
		if (!result) {
			throw new BadRequestError('Assignment creation failed', { code: 'ASSIGNMENT_CREATE_FAILED' })
		}

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'iam',
			entity: 'user_assignment',
			entityId: result.id,
			action: 'create',
			summary: `Assigned user ${data.userId} to role ${data.roleId} at location ${data.locationId ?? 'global'}`,
			newValues: { userId: data.userId, roleId: data.roleId, locationId: data.locationId },
		})

		return result
	}

	async handleRemove(data: AssignmentRemoveDto, actorId: ActorId): Promise<EntityRef> {
		// 1. Find the exact assignment
		const existing = await this.repo.findExact(data.userId, data.roleId, data.locationId)
		if (!existing) {
			throw new NotFoundError('Assignment not found', {
				code: 'ASSIGNMENT_NOT_FOUND',
				context: { userId: data.userId, roleId: data.roleId, locationId: data.locationId },
			})
		}

		// 2. Block removal of last owner assignment
		await this.#guardLastOwner(data.roleId)

		// 3. Hard delete
		const result = await this.repo.remove(existing.id)
		if (!result) {
			throw new BadRequestError('Assignment removal failed', { code: 'ASSIGNMENT_REMOVE_FAILED' })
		}

		// 4. Audit log
		auditLog.record({
			userId: actorId,
			userName: '',
			module: 'iam',
			entity: 'user_assignment',
			entityId: existing.id,
			action: 'delete',
			summary: `Removed user ${data.userId} from role ${data.roleId} at location ${data.locationId ?? 'global'}`,
		})

		return result
	}

	// ─── Private ───

	async #guardLastOwner(roleId: number): Promise<void> {
		// Look up the role code for this roleId
		const [role] = await this.repo.db
			.select({ code: roles.code })
			.from(roles)
			.where(eq(roles.id, roleId))
			.limit(1)

		if (!role || role.code !== OWNER_ROLE_CODE) return

		// This is an owner role — check if it's the last one
		const ownerCount = await this.repo.countOwnerAssignments()
		if (ownerCount <= 1) {
			throw new BadRequestError('Cannot remove the last owner assignment', {
				code: 'LAST_OWNER_ASSIGNMENT',
			})
		}
	}
}
