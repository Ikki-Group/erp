import { record } from '@elysiajs/opentelemetry'

import type { WithPaginationResult } from '@/core/database'

import type { UserAssignmentService } from '@/modules/iam/assignment.service'
import type { RoleService } from '@/modules/iam/role.service'
import type { UserReadDetailSchema } from '@/modules/iam/user-read.schema'
import type { UserFilterSchema } from '@/modules/iam/user.schema'
import type { UserService } from '@/modules/iam/user.service'
import type { LocationServiceModule } from '@/modules/location'

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

	async loadUserRelations(svc: Deps['svc'], userIds: number[]): Promise<UserRelations> {
		const [assignments, roleMap, superadmin, locationMap, locations] = await Promise.all([
			svc.assignment.getListByUserIds(userIds),
			svc.role.getRelationMap(),
			svc.role.getSuperadmin(),
			svc.location.getRelationMap(),
			svc.location.getListAll(),
		])

		return {
			assignments,
			roleMap,
			superadmin,
			locationMap,
			locations,
		}
	}
	// oxlint-disable-next-line no-unused-private-class-members typescript/require-await no-unused-private-class-members
	// async #buildUserAssignments(
	// 	user: UserSchema,
	// 	roleMapper?: RelationMap<number, RoleSchema>,
	// 	locationMapper?: RelationMap<number, LocationSchema>,
	// ) {
	// 	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	// 	const result: UserReadDetailSchema = { ...user } as UserReadDetailSchema
	// 	return result
	// }

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: UserFilterSchema): Promise<WithPaginationResult<UserReadDetailSchema>> {
		return record('UserReadService.handleList', async () => {
			const { data, meta } = await this.deps.svc.user.getListPaginated(filter)
			const userIds = Array.from(new Set(data.map((u) => u.id)))

			const [assignments, roleMap, superadmin, locationMap, locations] = await Promise.all([
				this.deps.svc.assignment.getListByUserIds(userIds),
				this.deps.svc.role.getRelationMap(),
				this.deps.svc.role.getSuperadmin(),
				this.deps.svc.location.getRelationMap(),
				this.deps.svc.location.getListAll(),
			])

			// Precompute superadmin assignments ONCE
			const superadminAssignments = locations.map((loc) => ({
				...this.deps.svc.assignment.getDefaultAssignmentForSuperadmin(),
				location: loc,
				role: superadmin,
			}))

			const users: UserReadDetailSchema[] = []

			for (const rawUser of data) {
				const user: UserReadDetailSchema = {
					...rawUser,
					assignments: [],
				}

				if (user.isRoot) {
					user.assignments = superadminAssignments
				} else {
					const uas = assignments[user.id]
					if (uas && uas.length > 0) {
						for (const ua of uas) {
							user.assignments = [
								...user.assignments,
								{
									...ua,
									role: roleMap.getRequired(ua.roleId),
									location: locationMap.getRequired(ua.locationId),
								},
							]
						}
					}
				}

				users.push(user)
			}

			return { meta, data: users }
		})
	}
}
