import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

import {
	ReceivingConfirmDto,
	ReceivingCreateDto,
	ReceivingDetailDto,
	ReceivingDetailQueryDto,
	ReceivingDto,
	ReceivingFilterDto,
	ReceivingUpdateDto,
} from './receiving.contract.ts'
import type { ReceivingService } from './receiving.service.ts'

// ─── Route Factory ───

export function createReceivingRoute(service: ReceivingService) {
	return new Elysia({ prefix: '/receiving', tags: ['Receiving'] })
		.use(authPlugin)
		.use(rbac)

		.get(
			'/list',
			async ({ query, actor }) => {
				const result = await service.handleList(query, actor)
				return res.paginated(result)
			},
			{
				query: ReceivingFilterDto,
				response: zRes.paginated(ReceivingDto),
				permission: 'receiving.read',
				detail: { summary: 'List receivings' },
			},
		)
		.get(
			'/detail',
			async ({ query, actor }) => {
				const result = await service.handleDetail(query.id, actor)
				return res.ok(result)
			},
			{
				query: ReceivingDetailQueryDto,
				response: zRes.ok(ReceivingDetailDto),
				permission: 'receiving.read',
				detail: { summary: 'Get receiving detail' },
			},
		)
		.post(
			'/create',
			async ({ body, actor }) => {
				const result = await service.handleCreate(body, actor)
				return res.created(result)
			},
			{
				body: ReceivingCreateDto,
				auth: true,
				permission: 'receiving.create',
				detail: {
					summary: 'Create a draft receiving',
					description:
						'Creates a `draft` receiving with generated number. Materials must be assigned to the location and each line UoM must convert to the material base UoM. No stock is posted until confirmed.',
				},
				response: zRes.created(EntityRefDto),
			},
		)
		.put(
			'/update',
			async ({ body, actor }) => {
				const result = await service.handleUpdate(body, actor)
				return res.ok(result)
			},
			{
				body: ReceivingUpdateDto,
				auth: true,
				permission: 'receiving.update',
				detail: {
					summary: 'Update a draft receiving',
					description: 'Draft only. When `lines` is supplied it replaces all existing lines.',
				},
				response: zRes.ok(EntityRefDto),
			},
		)
		.post(
			'/confirm',
			async ({ body, actor }) => {
				const result = await service.handleConfirm(body, actor)
				return res.ok(result)
			},
			{
				body: ReceivingConfirmDto,
				auth: true,
				permission: 'receiving.confirm',
				detail: {
					summary: 'Confirm a receiving',
					description:
						'Draft only. Posts a `purchase_receipt` stock-in movement per line at the receiving location, converting quantity and unit cost to the material base UoM, then marks the receiving `confirmed`.',
				},
				response: zRes.ok(EntityRefDto),
			},
		)
}
