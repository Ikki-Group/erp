import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/types/pagination'

import type { LocationServiceModule } from '@/modules/location'

import type { UserAssignmentService } from '../assignment/assignment.service'
import type { RoleService } from '../role/role.service'
import type { UserSchema } from '../user/user.contract'
import type { UserService } from '../user/user.service'
import type { UserDetailSchema, UserFilterSchema } from './composed.contract'
import type { IamComposedRepo } from './composed.repo'

interface UserRelations {
	assignments: Awaited<ReturnType<UserAssignmentService['getRecordByUserId']>>
	superadmin: Awaited<ReturnType<RoleService['getSuperadmin']>>
	rolesMap: Awaited<ReturnType<RoleService['getRelationMap']>>
	locations: Awaited<ReturnType<LocationServiceModule['location']['getListAll']>>
	locationsMap: Awaited<ReturnType<LocationServiceModule['location']['getRelationMap']>>
}

interface ServiceDeps {
	role: RoleService
	assignment: UserAssignmentService
	user: UserService
	location: LocationServiceModule['location']
}

export class IamComposedService {
	constructor(
		private readonly deps: ServiceDeps,
		private readonly repo: IamComposedRepo,
	) {}

	async #loadRelations(userIds: number[]): Promise<UserRelations> {
		const [assignments, superadmin, rolesMap, locations, locationsMap] = await Promise.all([
			this.deps.assignment.getRecordByUserId(userIds),
			this.deps.role.getSuperadmin(),
			this.deps.role.getRelationMap(),
			this.deps.location.getListAll(),
			this.deps.location.getRelationMap(),
		])

		return {
			superadmin,
			assignments,
			rolesMap,
			locations,
			locationsMap,
		}
	}

	#mapUserDetail(rawUser: UserSchema, relations: UserRelations): UserDetailSchema {
		const user: UserDetailSchema = {
			...rawUser,
			assignments: [],
		}

		if (user.isRoot) {
			user.assignments = relations.locations.map((location) => ({
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

	async getListPaginated(
		filter: UserFilterSchema,
	): Promise<WithPaginationResult<UserDetailSchema>> {
		return record('IamComposedService.getListPaginated', async () => {
			const { data: raw, meta } = await this.repo.getListPaginated(filter)
			const userIds = raw.map((x) => x.id)

			const relations = await this.#loadRelations(userIds)
			const data: UserDetailSchema[] = []

			for (const user of raw) {
				data.push(this.#mapUserDetail(user, relations))
			}

			return {
				data,
				meta,
			}
		})
	}

	async getDetailById(id: number): Promise<UserDetailSchema> {
		return record('IamComposedService.getDetailById', async () => {
			const user = await this.deps.user.getById(id)
			if (!user) throw NotFoundError.fromEntity('User', id)
			return this.#mapUserDetail(user, await this.#loadRelations([user.id]))
		})
	}
}
