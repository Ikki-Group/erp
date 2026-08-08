import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'

import {
	ProductionDetailQueryDto,
	ProductionOrderConfirmDto,
	ProductionOrderCreateDto,
	ProductionOrderFilterDto,
	ProductionRecipeCreateDto,
	ProductionRecipeFilterDto,
	ProductionRecipeUpdateDto,
} from './production.contract.ts'

import type { ProductionService } from './production.service.ts'

// ─── Route Factory ───

export function createProductionRoute(service: ProductionService) {
	return new Elysia({ prefix: '/production' })
		.use(authPluginMacro)

		// ─── Recipe Routes ───

		.get(
			'/recipe/list',
			async ({ query }) => {
				const result = await service.handleRecipeList(query)
				return res.paginated(result)
			},
			{ query: ProductionRecipeFilterDto },
		)
		.get(
			'/recipe/detail',
			async ({ query }) => {
				const result = await service.handleRecipeDetail(query.id)
				return res.ok(result)
			},
			{ query: ProductionDetailQueryDto },
		)
		.post(
			'/recipe/create',
			async ({ body, auth }) => {
				const result = await service.handleRecipeCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: ProductionRecipeCreateDto, auth: true },
		)
		.put(
			'/recipe/update',
			async ({ body, auth }) => {
				const result = await service.handleRecipeUpdate(body, auth.userId)
				return res.ok(result)
			},
			{ body: ProductionRecipeUpdateDto, auth: true },
		)
		.delete(
			'/recipe/remove',
			async ({ query, auth }) => {
				await service.handleRecipeRemove(query.id, auth.userId)
				return res.ok({ success: true })
			},
			{ query: ProductionDetailQueryDto, auth: true },
		)

		// ─── Order Routes ───

		.get(
			'/order/list',
			async ({ query }) => {
				const result = await service.handleOrderList(query)
				return res.paginated(result)
			},
			{ query: ProductionOrderFilterDto },
		)
		.get(
			'/order/detail',
			async ({ query }) => {
				const result = await service.handleOrderDetail(query.id)
				return res.ok(result)
			},
			{ query: ProductionDetailQueryDto },
		)
		.post(
			'/order/create',
			async ({ body, auth }) => {
				const result = await service.handleOrderCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: ProductionOrderCreateDto, auth: true },
		)
		.post(
			'/order/confirm',
			async ({ body, auth }) => {
				const result = await service.handleOrderConfirm(body, auth.userId)
				return res.ok(result)
			},
			{ body: ProductionOrderConfirmDto, auth: true },
		)
}
