import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
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
		new Elysia({ prefix: '/production', tags: ['production'] })
			.use(authPlugin)
			.use(rbac)

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
					return res.created(result)
				},
				{
					body: ProductionRecipeCreateDto,
					auth: true,
					permission: 'production.create',
					response: zRes.created(EntityRefDto),
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
					auth: true,
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
					auth: true,
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
					return res.created(result)
				},
				{
					body: ProductionOrderCreateDto,
					auth: true,
					permission: 'production.create',
					response: zRes.created(EntityRefDto),
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
					auth: true,
					permission: 'production.confirm',
					response: zRes.ok(EntityRefDto),
				},
			)
	)
}
