import { record } from '@elysiajs/opentelemetry'

import { SEED_CONFIG } from '@/config/seed-config'
import type { DbContext } from '@/infra/database'

import type { IamModule } from '@/modules/iam'
import { SYSTEM_ROLE_DEFINITIONS } from '@/modules/iam/constants'
import type { LocationModule } from '@/modules/location'

interface Deps {
	iam: IamModule
	location: LocationModule
}

export class SeedService {
	constructor(
		private readonly db: DbContext,
		private readonly deps: Deps,
	) {}

	async seed(): Promise<void> {
		return record('SeedService.seed', async () => {
			await this.db.transaction(async (db) => {
				const SYSTEM_ACTOR_ID = 1

				// 1. Seed Roles (OWNER, MANAGER, CASHIER, STAFF)
				await this.deps.iam.role.seed(
					SYSTEM_ROLE_DEFINITIONS.map((r) => ({
						code: r.code,
						name: r.name,
						description: r.description,
						scope: r.scope,
						permissions: [...r.permissions],
						isSystem: r.isSystem,
						createdBy: SYSTEM_ACTOR_ID,
					})),
					db,
				)

				// 2. Seed Users (owner account)
				await this.deps.iam.user.seed(
					[
						{
							id: 1,
							email: SEED_CONFIG.USER_OWNER_EMAIL,
							username: SEED_CONFIG.USER_OWNER_USERNAME,
							fullname: 'Owner',
							password: SEED_CONFIG.USER_OWNER_PASSWORD,
							createdBy: SYSTEM_ACTOR_ID,
						},
					],
					db,
				)

				// 3. Seed Locations
				await this.deps.location.seed(
					SEED_CONFIG.LOCATIONS.map((l, i) => ({
						id: i,
						code: l.code,
						name: l.name,
						type: l.type,
						isActive: true,
						createdBy: SYSTEM_ACTOR_ID,
					})),
					db,
				)

				// 4. Assign owner user to first location with OWNER role.
				// OWNER role has global scope so assignment is optional (for default location preference).
				// Role ID 1 = OWNER (first seeded role).
				const firstLocationId = 0
				await this.deps.iam.assignment.replaceByUserId(
					SYSTEM_ACTOR_ID,
					[{ roleId: 1, locationId: firstLocationId }],
					SYSTEM_ACTOR_ID,
					db,
				)
			})
		})
	}
}
