import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

import {
	TransferCreateDto,
	TransferDetailDto,
	TransferDetailQueryDto,
	TransferDto,
	TransferFilterDto,
	TransferReceiveDto,
	TransferShipDto,
} from './transfer.contract.ts'
import type { TransferService } from './transfer.service.ts'

// ─── Route Factory ───

export function createTransferRoute(service: TransferService) {
	return new Elysia({ prefix: '/transfer' })
		.use(authPlugin)
		.use(rbac)

		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: TransferFilterDto,
				response: zRes.paginated(TransferDto),
				permission: 'transfer.read',
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: TransferDetailQueryDto,
				response: zRes.ok(TransferDetailDto),
				permission: 'transfer.read',
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, actorOf(auth))
				return res.created(result)
			},
			{
				body: TransferCreateDto,
				auth: true,
				permission: 'transfer.create',
				response: zRes.created(EntityRefDto),
			},
		)
		.post(
			'/ship',
			async ({ body, auth }) => {
				const result = await service.handleShip(body, actorOf(auth))
				return res.ok(result)
			},
			{
				body: TransferShipDto,
				auth: true,
				permission: 'transfer.ship',
				response: zRes.ok(EntityRefDto),
			},
		)
		.post(
			'/receive',
			async ({ body, auth }) => {
				const result = await service.handleReceive(body, actorOf(auth))
				return res.ok(result)
			},
			{
				body: TransferReceiveDto,
				auth: true,
				permission: 'transfer.receive',
				response: zRes.ok(EntityRefDto),
			},
		)
}
