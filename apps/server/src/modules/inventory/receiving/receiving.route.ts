import { zRes } from '@ikki/contract/http'
import {
	ReceivingConfirmDto,
	ReceivingCreateDto,
	ReceivingDetailDto,
	ReceivingDetailQueryDto,
	ReceivingDto,
	ReceivingFilterDto,
	ReceivingUpdateDto,
} from '@ikki/contract/inventory/receiving'
import { EntityRefDto } from '@ikki/contract/schema'
import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { res } from '@/shared/http/response.ts'

import type { ReceivingService } from './receiving.service.ts'

// ─── Route Factory ───

export function createReceivingRoute(service: ReceivingService) {
	return new Elysia({ prefix: '/receiving' })
		.use(authGuard)

		.get(
			'/list',
			async ({ query, auth }) => {
				const result = await service.handleList(query, actorOf(auth))
				return res.paginated(result)
			},
			{
				query: ReceivingFilterDto,
				response: zRes.paginated(ReceivingDto),
				permission: 'receiving.read',
			},
		)
		.get(
			'/detail',
			async ({ query, auth }) => {
				const result = await service.handleDetail(query.id, actorOf(auth))
				return res.ok(result)
			},
			{
				query: ReceivingDetailQueryDto,
				response: zRes.ok(ReceivingDetailDto),
				permission: 'receiving.read',
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, actorOf(auth))
				return res.ok(result)
			},
			{
				body: ReceivingCreateDto,
				permission: 'receiving.create',
				response: zRes.ok(EntityRefDto),
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, actorOf(auth))
				return res.ok(result)
			},
			{
				body: ReceivingUpdateDto,
				permission: 'receiving.update',
				response: zRes.ok(EntityRefDto),
			},
		)
		.post(
			'/confirm',
			async ({ body, auth }) => {
				const result = await service.handleConfirm(body, actorOf(auth))
				return res.ok(result)
			},
			{
				body: ReceivingConfirmDto,
				permission: 'receiving.confirm',
				response: zRes.ok(EntityRefDto),
			},
		)
}
