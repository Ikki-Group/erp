import { record } from '@elysiajs/opentelemetry'

import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { ProductServiceModule } from '@/modules/product'

import { SEED_CONFIG } from '@/config/seed-config'
import { db } from '@/db'

export class SeedService {
  constructor(
    private readonly iamSvc: IamServiceModule,
    private readonly locationSvc: LocationServiceModule,
    private readonly productSvc: ProductServiceModule
  ) {}

  async seed(): Promise<void> {
    return record('SeedService.seed', async () => {
      // Use Drizzle transaction for the entire seed process
      await db.transaction(async () => {
        const SYSTEM_ACTOR_ID = 1

        // 1. Seed Roles
        await this.iamSvc.role.seed([
          {
            code: SEED_CONFIG.ROLE_SUPERADMIN_CODE,
            name: 'Administrator',
            createdBy: SYSTEM_ACTOR_ID,
          },
        ])

        // 2. Seed Users
        await this.iamSvc.user.seed([
          {
            email: SEED_CONFIG.USER_SUPERADMIN_EMAIL,
            username: SEED_CONFIG.USER_SUPERADMIN_USERNAME,
            fullname: 'Administrator',
            password: SEED_CONFIG.USER_SUPERADMIN_PASSWORD,
            isRoot: true,
            isActive: true,
            createdBy: SYSTEM_ACTOR_ID,
            assignments: [],
          },
        ])

        // 3. Seed Locations
        await this.locationSvc.location.seed(
          SEED_CONFIG.LOCATIONS.map((l) => ({
            code: l.code,
            name: l.name,
            type: l.type,
            createdBy: SYSTEM_ACTOR_ID,
          }))
        )

        // 4. Seed Sales Types
        await this.productSvc.salesType.seed(
          SEED_CONFIG.SALES_TYPES.map((st) => ({
            code: st.code,
            name: st.name,
            createdBy: SYSTEM_ACTOR_ID,
          }))
        )
      })
    })
  }
}
