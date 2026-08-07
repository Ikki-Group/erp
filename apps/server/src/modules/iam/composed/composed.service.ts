import { record } from '@elysiajs/opentelemetry'

import { assertFound } from '@/infra/database'
import { logger } from '@/infra/logger'
import type { WithPaginationResult } from '@/shared/types/pagination'

import type { LocationModule } from '@/modules/location'

import type { UserAssignmentService } from '../assignment/assignment.service'
import { isGlobalRole } from '../role/role.contract'
import type { RoleService } from '../role/role.service'
import type { UserDto } from '../user/user.contract'
import { UserError } from '../user/user.internal'
import type { UserService } from '../user/user.service'
import type { UserDetailDto, UserFilterDto } from './composed.contract'
import type { IIamComposedRepo } from './composed.repo'

interface UserRelations {
	assignments: Awaited<ReturnType<UserAssignmentService['getRecordByUserId']>>
	rolesMap: Awaited<ReturnType<RoleService['toRelationMap']>>
	locationsMap: Awaited<ReturnType<LocationModule['toRelationMap']>>
}

interface ServiceDeps {
	role: RoleService
	assignment: UserAssignmentService
	user: UserService
	location: LocationModule
}

export class IamComposedService {
	constructor(
		private readonly deps: ServiceDeps,
		private readonly repo: IIamComposedRepo,
	) {}

	async #loadRelations(userIds: number[]): Promise<UserRelations> {
		const [assignments, rolesMap, locationsMap] = await Promise.all([
			this.deps.assignment.getRecordByUserId(userIds),
			this.deps.role.getAll().then((x) => this.deps.role.toRelationMap(x)),
			this.deps.location.getListAll().then((x) => this.deps.location.toRelationMap(x)),
		])

		return {
			assignments,
			rolesMap,
			locationsMap,
		}
	}

	#mapUserDetail(rawUser: UserDto, relations: UserRelations): UserDetailDto {
		const uas = relations.assignments[rawUser.id] ?? []
		const assignments: UserDetailDto['assignments'] = []
		let hasGlobalAccess = false

		for (const ua of uas) {
			const role = relations.rolesMap.get(ua.roleId)
			const location = relations.locationsMap.get(ua.locationId)

			// Degrade gracefully on a dangling FK (e.g. removed role/location)
			// instead of crashing the entire list page.
			if (!role || !location) {
				logger.warn('Skipping assignment {assignmentId} for user {userId}: missing role/location', {
					assignmentId: ua.id,
					userId: rawUser.id,
					roleId: ua.roleId,
					locationId: ua.locationId,
				})
				continue
			}

			if (isGlobalRole(role)) {
				hasGlobalAccess = true
			}

			assignments.push({ ...ua, role, location })
		}

		// A user might have a global-scoped role without any assignment rows.
		// Check all roles this user is assigned to determine global access.
		if (!hasGlobalAccess && uas.length > 0) {
			hasGlobalAccess = uas.some((ua) => {
				const role = relations.rolesMap.get(ua.roleId)
				return role ? isGlobalRole(role) : false
			})
		}

		return {
			...rawUser,
			hasGlobalAccess,
			assignments,
		}
	}

	async getListPaginated(filter: UserFilterDto): Promise<WithPaginationResult<UserDetailDto>> {
		return record('IamComposedService.getListPaginated', async () => {
			const { data: raw, meta } = await this.repo.getListPaginated(filter)
			const userIds = raw.map((x) => x.id)

			const relations = await this.#loadRelations(userIds)
			const data: UserDetailDto[] = []

			for (const user of raw) {
				data.push(this.#mapUserDetail(user, relations))
			}

			return {
				data,
				meta,
			}
		})
	}

	async getDetailById(id: number): Promise<UserDetailDto> {
		return record('IamComposedService.getDetailById', async () => {
			const user = assertFound(await this.deps.user.getById(id), () => UserError.notFound(id))
			return this.#mapUserDetail(user, await this.#loadRelations([user.id]))
		})
	}
}
