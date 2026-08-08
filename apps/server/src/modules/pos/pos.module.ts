import type { CacheClient } from '@/infra/cache/index.ts'
import type { DbContext } from '@/infra/database/index.ts'

import type { LocationService } from '@/modules/location/location.service.ts'

import { createPosRoute } from './pos.route.ts'
import { createShiftModule } from './shift/shift.module.ts'
import { createVoucherModule } from './voucher/voucher.module.ts'

// ─── Dependencies ───

export interface PosModuleDeps {
	locationService: LocationService
}

// ─── Module Factory ───

export function createPosModule(db: DbContext, cacheClient: CacheClient, deps: PosModuleDeps) {
	const voucher = createVoucherModule(db, cacheClient)
	const shift = createShiftModule(db, cacheClient, {
		locationService: deps.locationService,
	})
	const route = createPosRoute({ voucher, shift })
	return { route, voucherService: voucher.service, shiftService: shift.service }
}
