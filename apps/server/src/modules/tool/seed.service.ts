import { record } from '@elysiajs/opentelemetry'

import { SEED_CONFIG } from '@/config/seed-config'
import type { DbContext } from '@/infra/database'

import type { IamModule } from '@/modules/iam'
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
			// Use Drizzle transaction for the entire seed process
			await this.db.transaction(async (db) => {
				const SYSTEM_ACTOR_ID = 1

				// 1. Seed Roles
				await this.deps.iam.role.seed(
					[
						{
							code: SEED_CONFIG.ROLE_SUPERADMIN_CODE,
							name: 'Administrator',
							description: 'Super administrator',
							permissions: ['*'],
							isSystem: true,
							createdBy: SYSTEM_ACTOR_ID,
						},
						{
							code: 'MANAGER',
							name: 'Manager',
							description: null,
							permissions: [],
							isSystem: false,
							createdBy: SYSTEM_ACTOR_ID,
						},
					],
					db,
				)

				// 2. Seed Users
				await this.deps.iam.user.seed(
					[
						{
							id: 1,
							email: SEED_CONFIG.USER_SUPERADMIN_EMAIL,
							username: SEED_CONFIG.USER_SUPERADMIN_USERNAME,
							fullname: 'Administrator',
							password: SEED_CONFIG.USER_SUPERADMIN_PASSWORD,
							isRoot: true,
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

				// 4. Seed Sales Types
				// await this.salesTypeSvc.seed(
				// 	SEED_CONFIG.SALES_TYPES.map((st) => ({
				// 		code: st.code,
				// 		name: st.name,
				// 		isSystem: st.isSystem,
				// 		createdBy: SYSTEM_ACTOR_ID,
				// 	})),
				// )

				// 5. Seed UOMs
				// await this.materialUomSvc.seed(
				// 	SEED_CONFIG.UOMS.map((u) => ({ code: u.code, createdBy: SYSTEM_ACTOR_ID })),
				// )
			})
		})
	}
}
