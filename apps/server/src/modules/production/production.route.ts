import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto } from '@/shared/schema/index.ts'

import {
	ProductionDetailQueryDto,
	ProductionOrderConfirmDto,
	ProductionOrderCreateDto,
	ProductionOrderDetailDto,
	ProductionOrderDto,
	ProductionOrderFilterDto,
	ProductionRecipeCreateDto,
	ProductionRecipeDetailDto,
	ProductionRecipeDto,
	ProductionRecipeFilterDto,
	ProductionRecipeUpdateDto,
} from './production.contract.ts'
import type { ProductionService } from './production.service.ts'

// ─── Route Factory ───

export function createProductionRoute(service: ProductionService) {
	return (
		new Elysia({ prefix: '/production' })
			.use(authPluginMacro)

			// ─── Recipe Routes ───

			.get(
				'/recipe/list',
				async ({ query }) => {
					const result = await service.handleRecipeList(query)
					return res.paginated(result)
				},
				{ query: ProductionRecipeFilterDto, response: zRes.paginated(ProductionRecipeDto) },
			)
			.get(
				'/recipe/detail',
				async ({ query }) => {
					const result = await service.handleRecipeDetail(query.id)
					return res.ok(result)
				},
				{ query: ProductionDetailQueryDto, response: zRes.ok(ProductionRecipeDetailDto) },
			)
			.post(
				'/recipe/create',
				async ({ body, auth }) => {
					const result = await service.handleRecipeCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: ProductionRecipeCreateDto, auth: true, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/recipe/update',
				async ({ body, auth }) => {
					const result = await service.handleRecipeUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: ProductionRecipeUpdateDto, auth: true, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/recipe/remove',
				async ({ query, auth }) => {
					await service.handleRecipeRemove(query.id, auth.userId)
					return res.ok({ id: query.id })
				},
				{ query: ProductionDetailQueryDto, auth: true, response: zRes.ok(EntityRefDto) },
			)

			// ─── Order Routes ───

			.get(
				'/order/list',
				async ({ query }) => {
					const result = await service.handleOrderList(query)
					return res.paginated(result)
				},
				{ query: ProductionOrderFilterDto, response: zRes.paginated(ProductionOrderDto) },
			)
			.get(
				'/order/detail',
				async ({ query }) => {
					const result = await service.handleOrderDetail(query.id)
					return res.ok(result)
				},
				{ query: ProductionDetailQueryDto, response: zRes.ok(ProductionOrderDetailDto) },
			)
			.post(
				'/order/create',
				async ({ body, auth }) => {
					const result = await service.handleOrderCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: ProductionOrderCreateDto, auth: true, response: zRes.created(EntityRefDto) },
			)
			.post(
				'/order/confirm',
				async ({ body, auth }) => {
					const result = await service.handleOrderConfirm(body, auth.userId)
					return res.ok(result)
				},
				{ body: ProductionOrderConfirmDto, auth: true, response: zRes.ok(EntityRefDto) },
			)
	)
}
