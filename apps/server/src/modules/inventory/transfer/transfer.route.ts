import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
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
		.use(authPluginMacro)

		.get(
			'/list',
			async ({ query }) => {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{ query: TransferFilterDto, response: zRes.paginated(TransferDto) },
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: TransferDetailQueryDto, response: zRes.ok(TransferDetailDto) },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: TransferCreateDto, auth: true, response: zRes.created(EntityRefDto) },
		)
		.post(
			'/ship',
			async ({ body, auth }) => {
				const result = await service.handleShip(body, auth.userId)
				return res.ok(result)
			},
			{ body: TransferShipDto, auth: true, response: zRes.ok(EntityRefDto) },
		)
		.post(
			'/receive',
			async ({ body, auth }) => {
				const result = await service.handleReceive(body, auth.userId)
				return res.ok(result)
			},
			{ body: TransferReceiveDto, auth: true, response: zRes.ok(EntityRefDto) },
		)
}
