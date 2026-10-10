import { zRes } from '@ikki/contract/http'
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
} from '@ikki/contract/production'
import { EntityRefDto } from '@ikki/contract/schema'
import { Elysia } from 'elysia'

import { authGuard } from '@/server/auth/auth.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { res } from '@/shared/http/response.ts'

import type { ProductionService } from './production.service.ts'

// ─── Route Factory ───

export function createProductionRoute(service: ProductionService) {
	return (
		new Elysia({ prefix: '/production', tags: ['production'] })
			.use(authGuard)

			// ─── Recipe Routes ───

			.get(
				'/recipe/list',
				async ({ query }) => {
					const result = await service.handleRecipeList(query)
					return res.paginated(result)
				},
				{
					query: ProductionRecipeFilterDto,
					response: zRes.paginated(ProductionRecipeDto),
					permission: 'production.read',
				},
			)
			.get(
				'/recipe/detail',
				async ({ query }) => {
					const result = await service.handleRecipeDetail(query.id)
					return res.ok(result)
				},
				{
					query: ProductionDetailQueryDto,
					response: zRes.ok(ProductionRecipeDetailDto),
					permission: 'production.read',
				},
			)
			.post(
				'/recipe/create',
				async ({ body, auth }) => {
					const result = await service.handleRecipeCreate(body, actorOf(auth))
					return res.ok(result)
				},
				{
					body: ProductionRecipeCreateDto,
					permission: 'production.create',
					response: zRes.ok(EntityRefDto),
				},
			)
			.put(
				'/recipe/update',
				async ({ body, auth }) => {
					const result = await service.handleRecipeUpdate(body, actorOf(auth))
					return res.ok(result)
				},
				{
					body: ProductionRecipeUpdateDto,
					permission: 'production.update',
					response: zRes.ok(EntityRefDto),
				},
			)
			.delete(
				'/recipe/remove',
				async ({ query, auth }) => {
					await service.handleRecipeRemove(query.id, actorOf(auth))
					return res.ok({ id: query.id })
				},
				{
					query: ProductionDetailQueryDto,
					permission: 'production.delete',
					response: zRes.ok(EntityRefDto),
				},
			)

			// ─── Order Routes ───

			.get(
				'/order/list',
				async ({ query }) => {
					const result = await service.handleOrderList(query)
					return res.paginated(result)
				},
				{
					query: ProductionOrderFilterDto,
					response: zRes.paginated(ProductionOrderDto),
					permission: 'production.read',
				},
			)
			.get(
				'/order/detail',
				async ({ query }) => {
					const result = await service.handleOrderDetail(query.id)
					return res.ok(result)
				},
				{
					query: ProductionDetailQueryDto,
					response: zRes.ok(ProductionOrderDetailDto),
					permission: 'production.read',
				},
			)
			.post(
				'/order/create',
				async ({ body, auth }) => {
					const result = await service.handleOrderCreate(body, actorOf(auth))
					return res.ok(result)
				},
				{
					body: ProductionOrderCreateDto,
					permission: 'production.create',
					response: zRes.ok(EntityRefDto),
				},
			)
			.post(
				'/order/confirm',
				async ({ body, auth }) => {
					const result = await service.handleOrderConfirm(body, actorOf(auth))
					return res.ok(result)
				},
				{
					body: ProductionOrderConfirmDto,
					permission: 'production.confirm',
					response: zRes.ok(EntityRefDto),
				},
			)
	)
}
