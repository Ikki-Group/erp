import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'

import {
	ReceivingConfirmDto,
	ReceivingCreateDto,
	ReceivingDetailQueryDto,
	ReceivingFilterDto,
	ReceivingUpdateDto,
} from './receiving.contract.ts'
import type { ReceivingService } from './receiving.service.ts'

// ─── Route Factory ───

export function createReceivingRoute(service: ReceivingService) {
	return new Elysia({ prefix: '/receiving' })
		.use(authPluginMacro)

		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: ReceivingFilterDto },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: ReceivingDetailQueryDto },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: ReceivingCreateDto, auth: true },
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{ body: ReceivingUpdateDto, auth: true },
		)
		.post(
			'/confirm',
			async ({ body, auth }) => {
				const result = await service.handleConfirm(body, auth.userId)
				return res.ok(result)
			},
			{ body: ReceivingConfirmDto, auth: true },
		)
}
