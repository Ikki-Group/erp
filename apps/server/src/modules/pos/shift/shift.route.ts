import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	ShiftCloseDto,
	ShiftDetailDto,
	ShiftDto,
	ShiftFilterDto,
	ShiftOpenDto,
} from './shift.contract.ts'
import type { ShiftService } from './shift.service.ts'

// ─── Route Factory ───

export function createShiftRoute(service: ShiftService) {
	return new Elysia({ prefix: '/shift', tags: ['Shifts'] })
		.use(authPlugin)
		.use(rbac)

		.post(
			'/open',
			async ({ body, actor }) => {
				const result = await service.handleOpen(body, actor)
				return res.created(result)
			},
			{
				body: ShiftOpenDto,
				permission: 'shift.open',
				response: zRes.created(EntityRefDto),
				detail: {
					summary: 'Open a shift',
					description:
						'Opens a cashier shift for the caller. The location must be a store and the caller cannot already have an open shift there.',
				},
			},
		)
		.post(
			'/close',
			async ({ body, actor }) => {
				const result = await service.handleClose(body, actor)
				return res.ok(result)
			},
			{
				body: ShiftCloseDto,
				permission: 'shift.close',
				response: zRes.ok(EntityRefDto),
				detail: {
					summary: 'Close own shift',
					description:
						'Closes an open shift owned by the caller. Expected cash is the opening cash plus cash payments taken during the shift; it is stored next to the counted closing cash.',
				},
			},
		)
		.post(
			'/close-other',
			async ({ body, actor }) => {
				const result = await service.handleClose(body, actor)
				return res.ok(result)
			},
			{
				body: ShiftCloseDto,
				permission: 'shift.close-other',
				response: zRes.ok(EntityRefDto),
				detail: {
					summary: "Close another user's shift",
					description:
						'Same closing behaviour as closing your own shift, for a shift opened by someone else at a location where the caller may close others’ shifts.',
				},
			},
		)
		.get(
			'/active',
			async ({ actor }) => {
				const result = await service.handleGetActive(actor)
				return res.ok(result)
			},
			{
				permission: 'shift.read',
				response: zRes.ok(ShiftDto.nullable()),
				detail: {
					summary: 'Get my active shift',
					description:
						'Returns the caller’s open shift at the active location, or `null` when none is open or no location is selected.',
				},
			},
		)
		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: ShiftFilterDto,
				permission: 'shift.read',
				response: zRes.paginated(ShiftDto),
				detail: { summary: 'List shifts' },
			},
		)
		.get(
			'/detail',
			async ({ query, actor }) => {
				const result = await service.handleDetail(query.id, actor)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				permission: 'shift.read',
				response: zRes.ok(ShiftDetailDto),
				detail: { summary: 'Get shift detail' },
			},
		)
}
