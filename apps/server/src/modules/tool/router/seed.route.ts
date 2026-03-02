import Elysia from 'elysia'

import { res } from '@/lib/utils/response.util'
import { zPrimitive, zResponse } from '@/lib/validation'

import type { SeedService } from '../service/seed.service'

export function initSeedRoute(seedSvc: SeedService) {
  return new Elysia({ prefix: '/seed' }).post(
    '/',
    async function seed() {
      await seedSvc.seed()
      return res.ok('Seeding data...')
    },
    {
      response: zResponse.ok(zPrimitive.str),
    }
  )
}
