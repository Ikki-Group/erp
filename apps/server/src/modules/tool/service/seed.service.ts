import { record } from '@elysiajs/opentelemetry'
import mongoose, { Types } from 'mongoose'

import type { IamServiceModule } from '@/modules/iam'
import type { LocationServiceModule } from '@/modules/location'

import { SEED_CONFIG } from '@/config/seed-config'

export class SeedService {
  constructor(
    private readonly iamSvc: IamServiceModule,
    private readonly locationSvc: LocationServiceModule
  ) {}

  async seed(): Promise<void> {
    return record('SeedService.seed', async () => {
      await mongoose.connection.transaction(async (tx) => {
        await this.iamSvc.role.seed([
          {
            id: new Types.ObjectId(SEED_CONFIG.ROLE_SUPERADMIN_ID),
            code: 'SUPERADMIN',
            name: 'Administrator',
            createdBy: new Types.ObjectId(SEED_CONFIG.USER_SUPERADMIN_ID),
          },
        ])
      })

      await this.iamSvc.user.seed([
        {
          id: new Types.ObjectId(SEED_CONFIG.USER_SUPERADMIN_ID),
          email: SEED_CONFIG.USER_SUPERADMIN_EMAIL,
          username: SEED_CONFIG.USER_SUPERADMIN_USERNAME,
          fullname: 'Administrator',
          password: SEED_CONFIG.USER_SUPERADMIN_PASSWORD,
          isRoot: true,
          createdBy: new Types.ObjectId(SEED_CONFIG.USER_SUPERADMIN_ID),
        },
      ])

      await this.locationSvc.location.seed(
        SEED_CONFIG.LOCATIONS.map((l) => ({
          id: new Types.ObjectId(l.id),
          code: l.code,
          name: l.name,
          type: l.type,
          createdBy: new Types.ObjectId(SEED_CONFIG.USER_SUPERADMIN_ID),
        }))
      )
    })
  }
}
