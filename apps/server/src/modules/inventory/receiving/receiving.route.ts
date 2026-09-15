import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
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
	return new Elysia({ prefix: '/receiving' })
		.use(authPlugin)
		.use(rbac)

		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
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
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
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
				return res.created(result)
			},
			{
				body: ReceivingCreateDto,
				auth: true,
				permission: 'receiving.create',
				response: zRes.created(EntityRefDto),
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
				auth: true,
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
				auth: true,
				permission: 'receiving.confirm',
				response: zRes.ok(EntityRefDto),
			},
		)
}
