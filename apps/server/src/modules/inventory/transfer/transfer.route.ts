import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'

import {
	TransferCreateDto,
	TransferDetailQueryDto,
	TransferFilterDto,
	TransferReceiveDto,
	TransferShipDto,
} from './transfer.contract.ts'
import type { TransferService } from './transfer.service.ts'

// ─── Route Factory ───

export function createTransferRoute(service: TransferService) {
	return new Elysia({ prefix: '/transfer' })
		.use(authPluginMacro)

		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: TransferFilterDto },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: TransferDetailQueryDto },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: TransferCreateDto, auth: true },
		)
		.post(
			'/ship',
			async ({ body, auth }) => {
				const result = await service.handleShip(body, auth.userId)
				return res.ok(result)
			},
			{ body: TransferShipDto, auth: true },
		)
		.post(
			'/receive',
			async ({ body, auth }) => {
				const result = await service.handleReceive(body, auth.userId)
				return res.ok(result)
			},
			{ body: TransferReceiveDto, auth: true },
		)
}
