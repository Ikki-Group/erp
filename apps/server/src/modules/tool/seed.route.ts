import Elysia from 'elysia'

import { res } from '@/shared/http/response'
import { createSuccessResponseSchema, zp } from '@/shared/schema'

import type { SeedService } from './seed.service'

export function initSeedRoute(seedSvc: SeedService) {
	return new Elysia({ prefix: '/seed' }).post(
		'/',
		async function seed() {
			await seedSvc.seed()
			return res.ok('Seeding data...')
		},
		{ response: createSuccessResponseSchema(zp.str) },
	)
}
