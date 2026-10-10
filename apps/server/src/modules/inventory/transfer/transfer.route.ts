import { zRes } from '@ikki/contract/http'
import {
	TransferCreateDto,
	TransferDetailDto,
	TransferDetailQueryDto,
	TransferDto,
	TransferFilterDto,
	TransferReceiveDto,
	TransferShipDto,
} from '@ikki/contract/inventory/transfer'
import { EntityRefDto } from '@ikki/contract/schema'
import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { res } from '@/shared/http/response.ts'

import type { TransferService } from './transfer.service.ts'

// ─── Route Factory ───

export function createTransferRoute(service: TransferService) {
	return new Elysia({ prefix: '/transfer' })
		.use(authGuard)

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
				return res.ok(result)
			},
			{
				body: TransferCreateDto,
				permission: 'transfer.create',
				response: zRes.ok(EntityRefDto),
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
				permission: 'transfer.receive',
				response: zRes.ok(EntityRefDto),
			},
		)
}
