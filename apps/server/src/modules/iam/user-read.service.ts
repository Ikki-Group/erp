import { record } from '@elysiajs/opentelemetry'

import type { WithPaginationResult } from '@/infra/database'
import { NotFoundError } from '@/shared/errors/http-error'

import type { LocationServiceModule } from '@/modules/location'

import type { UserAssignmentService } from './assignment.service'
import type { RoleService } from './role.service'
import type { UserReadDetailSchema } from './user-read.schema'
import type { UserFilterSchema, UserSchema } from './user.schema'
import type { UserService } from './user.service'

interface Deps {
	svc: {
		role: RoleService
		assignment: UserAssignmentService
		user: UserService

		location: LocationServiceModule['location']
	}
}

interface UserRelations {
	assignments: Awaited<ReturnType<UserAssignmentService['getListByUserIds']>>
	roleMap: Awaited<ReturnType<RoleService['getRelationMap']>>
	superadmin: Awaited<ReturnType<RoleService['getSuperadmin']>>
	locationMap: Awaited<ReturnType<LocationServiceModule['location']['getRelationMap']>>
	locations: Awaited<ReturnType<LocationServiceModule['location']['getListAll']>>
}

export class UserReadService {
	constructor(private readonly deps: Deps) {}

	async #loadUserRelations(userIds: number[]): Promise<UserRelations> {
		const [assignments, roleMap, superadmin, locationMap, locations] = await Promise.all([
			this.deps.svc.assignment.getListByUserIds(userIds),
			this.deps.svc.role.getRelationMap(),
			this.deps.svc.role.getSuperadmin(),
			this.deps.svc.location.getRelationMap(),
			this.deps.svc.location.getListAll(),
		])

		return {
			assignments,
			roleMap,
			superadmin,
			locationMap,
			locations,
		}
	}

	#mapUserDetail(rawUser: UserSchema, relations: UserRelations): UserReadDetailSchema {
		const user: UserReadDetailSchema = {
			...rawUser,
			assignments: [],
		}

		if (user.isRoot) {
			user.assignments = relations.locations.map((location) => ({
				...this.deps.svc.assignment.getDefaultAssignmentForSuperadmin(),
				location,
				role: relations.superadmin,
			}))
		} else {
			const uas = relations.assignments[user.id]
			if (uas && uas.length > 0) {
				user.assignments = uas.map((ua) => ({
					...ua,
					role: relations.roleMap.getRequired(ua.roleId),
					location: relations.locationMap.getRequired(ua.locationId),
				}))
			}
		}

		return user
	}

	async #enrichUsers(rawUsers: UserSchema[]): Promise<UserReadDetailSchema[]> {
		if (rawUsers.length === 0) return []
		const userIds = Array.from(new Set(rawUsers.map((u) => u.id)))
		const relations = await this.#loadUserRelations(userIds)

		return rawUsers.map((u) => this.#mapUserDetail(u, relations))
	}

	async getDetailById(id: number): Promise<UserReadDetailSchema> {
		const user = await this.deps.svc.user.getById(id)
		if (!user) throw NotFoundError.fromEntity('User', id)
		return this.#mapUserDetail(user, await this.#loadUserRelations([user.id]))
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: UserFilterSchema): Promise<WithPaginationResult<UserReadDetailSchema>> {
		return record('UserReadService.handleList', async () => {
			const { data, meta } = await this.deps.svc.user.getListPaginated(filter)
			const users = await this.#enrichUsers(data)
			return { meta, data: users }
		})
	}

	async handleDetail(id: number): Promise<UserReadDetailSchema> {
		return record('UserReadService.handleDetail', async () => {
			return this.getDetailById(id)
		})
	}
}
