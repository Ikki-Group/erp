import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/shared/types/pagination'

import type { LocationModule } from '@/modules/location'

import type { UserAssignmentService } from '../assignment/assignment.service'
import type { RoleService } from '../role/role.service'
import type { UserDto } from '../user/user.contract'
import type { UserService } from '../user/user.service'
import type { UserDetailDto, UserFilterDto } from './composed.contract'
import type { IamComposedRepo } from './composed.repo'

interface UserRelations {
	assignments: Awaited<ReturnType<UserAssignmentService['getRecordByUserId']>>
	superadmin: Awaited<ReturnType<RoleService['getSuperadmin']>>
	rolesMap: Awaited<ReturnType<RoleService['toRelationMap']>>
	locationsMap: Awaited<ReturnType<LocationModule['location']['toRelationMap']>>
}

interface ServiceDeps {
	role: RoleService
	assignment: UserAssignmentService
	user: UserService
	location: LocationModule['location']
}

export class IamComposedService {
	constructor(
		private readonly deps: ServiceDeps,
		private readonly repo: IamComposedRepo,
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
				user.assignments = uas.map((ua) => ({
					...ua,
					role: relations.rolesMap.getRequired(ua.roleId),
					location: relations.locationsMap.getRequired(ua.locationId),
				}))
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
			if (!user) throw NotFoundError.fromEntity('User', id)
			return this.#mapUserDetail(user, await this.#loadRelations([user.id]))
		})
	}
}
