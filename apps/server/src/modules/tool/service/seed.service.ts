import { record } from '@elysiajs/opentelemetry'

import { SEED_CONFIG } from '@/config/seed-config'
import { db } from '@/db'
import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'
import type { MaterialServiceModule } from '@/modules/materials'
import type { ProductServiceModule } from '@/modules/product'

export class SeedService {
  constructor(
    private readonly iamSvc: IamServiceModule,
    private readonly locationSvc: LocationServiceModule,
    private readonly productSvc: ProductServiceModule,
    private readonly materialSvc: MaterialServiceModule,
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
            description: 'Super administrator',
            createdBy: SYSTEM_ACTOR_ID,
          },
          { code: 'MANAGER', name: 'Manager', description: null, createdBy: SYSTEM_ACTOR_ID },
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
          SEED_CONFIG.LOCATIONS.map((l) => ({ code: l.code, name: l.name, type: l.type, createdBy: SYSTEM_ACTOR_ID })),
        )

        // 4. Seed Sales Types
        await this.productSvc.salesType.seed(
          SEED_CONFIG.SALES_TYPES.map((st) => ({
            code: st.code,
            name: st.name,
            isSystem: st.isSystem,
            createdBy: SYSTEM_ACTOR_ID,
          })),
        )

        // 5. Seed UOMs
        await this.materialSvc.uom.seed(SEED_CONFIG.UOMS.map((u) => ({ code: u.code, createdBy: SYSTEM_ACTOR_ID })))
      })
    })
  }
}
