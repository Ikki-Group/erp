import { record } from '@elysiajs/opentelemetry'

import { logger } from '@/infra/logger'
import type { WithPaginationResult } from '@/shared/types/pagination'

import type { LocationModule } from '@/modules/location'

import type { UserAssignmentService } from '../assignment/assignment.service'
import type { RoleService } from '../role/role.service'
import type { UserDto } from '../user/user.contract'
import { UserError } from '../user/user.internal'
import type { UserService } from '../user/user.service'
import type { UserDetailDto, UserFilterDto } from './composed.contract'
import type { IIamComposedRepo } from './composed.repo'

interface UserRelations {
	assignments: Awaited<ReturnType<UserAssignmentService['getRecordByUserId']>>
	superadmin: Awaited<ReturnType<RoleService['getSuperadmin']>>
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
		const [assignments, superadmin, rolesMap, locationsMap] = await Promise.all([
			this.deps.assignment.getRecordByUserId(userIds),
			this.deps.role.getSuperadmin(),
			this.deps.role.getAll().then((x) => this.deps.role.toRelationMap(x)),
			this.deps.location.getListAll().then((x) => this.deps.location.toRelationMap(x)),
		])

		return {
			superadmin,
			assignments,
			rolesMap,
			locationsMap,
		}
	}

	#mapUserDetail(rawUser: UserDto, relations: UserRelations): UserDetailDto {
		const user: UserDetailDto = {
			...rawUser,
			assignments: [],
		}

		if (user.isRoot) {
			user.assignments = relations.locationsMap
				.mapToArray((v) => v)
				.map((location) => ({
					...this.deps.assignment.getDefaultAssignmentForSuperadmin(),
					location,
					role: relations.superadmin,
				}))
		} else {
			const uas = relations.assignments[user.id]
			if (uas && uas.length > 0) {
				user.assignments = uas.flatMap((ua) => {
					const role = relations.rolesMap.get(ua.roleId)
					const location = relations.locationsMap.get(ua.locationId)
					// Degrade gracefully on a dangling FK (e.g. removed role/location)
					// instead of crashing the entire list page.
					if (!role || !location) {
						logger.warn(
							'Skipping assignment {assignmentId} for user {userId}: missing role/location',
							{
								assignmentId: ua.id,
								userId: user.id,
								roleId: ua.roleId,
								locationId: ua.locationId,
							},
						)
						return []
					}
					return [{ ...ua, role, location }]
				})
			}
		}

		return user
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
			const user = await this.deps.user.getById(id)
			if (!user) throw UserError.notFound(id)
			return this.#mapUserDetail(user, await this.#loadRelations([user.id]))
		})
	}
}
