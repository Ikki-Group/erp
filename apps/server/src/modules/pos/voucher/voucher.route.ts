import { zRes } from '@ikki/contract/http'
import {
	VoucherCreateDto,
	VoucherDto,
	VoucherFilterDto,
	VoucherUpdateDto,
	VoucherValidateDto,
	VoucherValidateResponseDto,
} from '@ikki/contract/pos/voucher'
import { EntityRefDto, zq } from '@ikki/contract/schema'
import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { res } from '@/shared/http/response.ts'

import type { VoucherService } from './voucher.service.ts'

// ─── Route Factory ───

export function createVoucherRoute(service: VoucherService) {
	return new Elysia({ prefix: '/voucher' })
		.use(authGuard)

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
				return res.ok(result)
			},
			{
				body: VoucherCreateDto,
				permission: 'voucher.manage',
				response: zRes.ok(EntityRefDto),
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
