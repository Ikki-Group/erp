import { zRes } from '@ikki/contract/http'
import { InventoryLocationSummaryDto } from '@ikki/contract/inventory/summary'
import { Elysia } from 'elysia'
import { z } from 'zod'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'

import type { SummaryService } from './summary.service.ts'

// ─── Route Factory ───

export function createSummaryRoute(service: SummaryService) {
	return new Elysia().use(authGuard).get(
		'/summary',
		async ({ auth }) => {
			const result = await service.handleSummary(auth)
			return res.ok(result)
		},
		{
			response: zRes.ok(z.array(InventoryLocationSummaryDto)),
			anyLocationPermission: 'stock.read',
		},
	)
}
