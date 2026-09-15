import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	VoucherCreateDto,
	VoucherDto,
	VoucherFilterDto,
	VoucherUpdateDto,
	VoucherValidateDto,
	VoucherValidateResponseDto,
} from './voucher.contract.ts'
import type { VoucherService } from './voucher.service.ts'

// ─── Route Factory ───

export function createVoucherRoute(service: VoucherService) {
	return new Elysia({ prefix: '/voucher' })
		.use(authPlugin)
		.use(rbac)

		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: VoucherFilterDto,
				permission: 'voucher.manage',
				response: zRes.paginated(VoucherDto),
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleGetById(query.id)
				return res.ok(result)
			},
			{ query: zq.recordId, permission: 'voucher.manage', response: zRes.ok(VoucherDto) },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, actorOf(auth))
				return res.created(result)
			},
			{
				body: VoucherCreateDto,
				permission: 'voucher.manage',
				response: zRes.created(EntityRefDto),
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, actorOf(auth))
				return res.ok(result)
			},
			{ body: VoucherUpdateDto, permission: 'voucher.manage', response: zRes.ok(EntityRefDto) },
		)
		.delete(
			'/remove',
			async ({ query, auth }) => {
				const result = await service.handleDelete(query.id, actorOf(auth))
				return res.ok(result)
			},
			{ query: zq.recordId, permission: 'voucher.manage', response: zRes.ok(EntityRefDto) },
		)
		.post(
			'/validate',
			async ({ body }) => {
				const result = await service.handleValidate(body.code, body.orderTotal)
				return res.ok(result)
			},
			{
				body: VoucherValidateDto,
				permission: 'discount.apply',
				response: zRes.ok(VoucherValidateResponseDto),
			},
		)
}
