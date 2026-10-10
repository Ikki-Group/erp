import { zRes } from '@ikki/contract/http'
import {
	ShiftCloseDto,
	ShiftDetailDto,
	ShiftDto,
	ShiftFilterDto,
	ShiftOpenDto,
} from '@ikki/contract/pos/shift'
import { EntityRefDto, zq } from '@ikki/contract/schema'
import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { hasPermission } from '@/shared/auth/permission.ts'
import { res } from '@/shared/http/response.ts'

import type { ShiftService } from './shift.service.ts'

// ─── Route Factory ───

export function createShiftRoute(service: ShiftService) {
	return new Elysia({ prefix: '/shift' })
		.use(authGuard)

		.post(
			'/open',
			async ({ body, auth }) => {
				const result = await service.handleOpen(body, actorOf(auth))
				return res.ok(result)
			},
			{ body: ShiftOpenDto, permission: 'shift.open', response: zRes.ok(EntityRefDto) },
		)
		.post(
			'/close',
			async ({ body, auth }) => {
				const canCloseOther = hasPermission(auth, 'shift.close-other')
				const result = await service.handleClose(body, actorOf(auth), canCloseOther)
				return res.ok(result)
			},
			{ body: ShiftCloseDto, permission: 'shift.close', response: zRes.ok(EntityRefDto) },
		)
		.post(
			'/close-other',
			async ({ body, auth }) => {
				const result = await service.handleClose(body, actorOf(auth), true)
				return res.ok(result)
			},
			{ body: ShiftCloseDto, permission: 'shift.close-other', response: zRes.ok(EntityRefDto) },
		)
		.get(
			'/active',
			async ({ auth }) => {
				const shift =
					auth.locationId === null
						? undefined
						: await service.getActive(auth.userId, auth.locationId)
				return res.ok(shift ?? null)
			},
			{ permission: 'shift.read', response: zRes.ok(ShiftDto.nullable()) },
		)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: ShiftFilterDto, permission: 'shift.read', response: zRes.paginated(ShiftDto) },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: zq.recordId, permission: 'shift.read', response: zRes.ok(ShiftDetailDto) },
		)
}
