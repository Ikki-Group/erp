import { Elysia } from 'elysia'

import { authPlugin } from '@/server/plugins/auth.plugin.ts'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
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
					detail: { tags: ['Production Recipes'], summary: 'List production recipes' },
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
					detail: { tags: ['Production Recipes'], summary: 'Get a production recipe' },
				},
			)
			.post(
				'/recipe/create',
				async ({ body, actor }) => {
					const result = await service.handleRecipeCreate(body, actor)
					return res.created(result)
				},
				{
					body: ProductionRecipeCreateDto,
					auth: true,
					permission: 'production.create',
					response: zRes.created(EntityRefDto),
					detail: {
						tags: ['Production Recipes'],
						summary: 'Create a production recipe',
						description:
							'The output material must be semi-finished, and every yield and input UoM must be convertible to its material base UoM.',
					},
				},
			)
			.put(
				'/recipe/update',
				async ({ body, actor }) => {
					const result = await service.handleRecipeUpdate(body, actor)
					return res.ok(result)
				},
				{
					body: ProductionRecipeUpdateDto,
					auth: true,
					permission: 'production.update',
					response: zRes.ok(EntityRefDto),
					detail: { tags: ['Production Recipes'], summary: 'Update a production recipe' },
				},
			)
			.delete(
				'/recipe/remove',
				async ({ query, actor }) => {
					await service.handleRecipeRemove(query.id, actor)
					return res.ok({ id: query.id })
				},
				{
					query: ProductionDetailQueryDto,
					auth: true,
					permission: 'production.delete',
					response: zRes.ok(EntityRefDto),
					detail: { tags: ['Production Recipes'], summary: 'Delete a production recipe' },
				},
			)

			// ─── Order Routes ───

			.get(
				'/order/list',
				async ({ query, actor }) => {
					const result = await service.handleOrderList(query, actor)
					return res.paginated(result)
				},
				{
					query: ProductionOrderFilterDto,
					response: zRes.paginated(ProductionOrderDto),
					permission: 'production.read',
					detail: { tags: ['Production Orders'], summary: 'List production orders' },
				},
			)
			.get(
				'/order/detail',
				async ({ query, actor }) => {
					const result = await service.handleOrderDetail(query.id, actor)
					return res.ok(result)
				},
				{
					query: ProductionDetailQueryDto,
					response: zRes.ok(ProductionOrderDetailDto),
					permission: 'production.read',
					detail: { tags: ['Production Orders'], summary: 'Get a production order' },
				},
			)
			.post(
				'/order/create',
				async ({ body, actor }) => {
					const result = await service.handleOrderCreate(body, actor)
					return res.created(result)
				},
				{
					body: ProductionOrderCreateDto,
					auth: true,
					permission: 'production.create',
					response: zRes.created(EntityRefDto),
					detail: {
						tags: ['Production Orders'],
						summary: 'Create a production order',
						description:
							'Creates a draft order numbered `PRD-…`. Planned output is the recipe yield times `multiplier`; no stock moves until the order is confirmed.',
					},
				},
			)
			.post(
				'/order/confirm',
				async ({ body, actor }) => {
					const result = await service.handleOrderConfirm(body, actor)
					return res.ok(result)
				},
				{
					body: ProductionOrderConfirmDto,
					auth: true,
					permission: 'production.confirm',
					response: zRes.ok(EntityRefDto),
					detail: {
						tags: ['Production Orders'],
						summary: 'Confirm a production order',
						description:
							'Completes a draft order: consumes the recipe inputs from stock (`production_out`) and posts the output material into stock (`production_in`) at the order location, costed from the consumed inputs. Fails if the order is already completed or not draft.',
					},
				},
			)
	)
}
