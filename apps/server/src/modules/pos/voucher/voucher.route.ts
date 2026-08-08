import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
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
		.use(authPluginMacro)

		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: VoucherFilterDto, response: zRes.paginated(VoucherDto) },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleGetById(query.id)
				return res.ok(result)
			},
			{ query: zq.recordId, response: zRes.ok(VoucherDto) },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: VoucherCreateDto, response: zRes.created(EntityRefDto) },
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{ body: VoucherUpdateDto, response: zRes.ok(EntityRefDto) },
		)
		.delete(
			'/remove',
			async ({ query, auth }) => {
				const result = await service.handleDelete(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
		)
		.post(
			'/validate',
			async ({ body }) => {
				const result = await service.handleValidate(body.code, body.orderTotal)
				return res.ok(result)
			},
			{ body: VoucherValidateDto, response: zRes.ok(VoucherValidateResponseDto) },
		)
}
