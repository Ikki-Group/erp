import { Elysia } from 'elysia'

import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { EntityRef } from '@/shared/types/utils.ts'

import type { z } from 'zod'

// ─── Types ───

interface CrudRouteService<TFilter, TDto, TCreate, TUpdate> {
	handleList(filter: TFilter): Promise<WithPaginationResult<TDto>>
	handleGetById(id: number): Promise<TDto>
	handleCreate(data: TCreate, actor: Actor): Promise<EntityRef>
	handleUpdate(data: TUpdate, actor: Actor): Promise<EntityRef>
	handleDelete(id: number, actor: Actor): Promise<EntityRef>
}

interface CrudRouteConfig<
	F extends z.ZodType,
	D extends z.ZodType,
	C extends z.ZodType,
	U extends z.ZodType,
	R extends z.ZodType,
> {
	/** Route prefix, e.g. `/location`; nested under a parent prefix when `.use()`d. */
	prefix: string
	/** Permission resource: routes require `<resource>.read|create|update|delete`. */
	resource: string
	/** OpenAPI tags; defaults to `[resource]`. */
	tags?: string[]
	schemas: { filter: F; dto: D; create: C; update: U }
	service: CrudRouteService<z.output<F>, z.output<D>, z.output<C>, z.output<U>>
	/**
	 * `GET /detail`: defaults to `service.handleGetById` returning `dto`.
	 * Pass a custom response/handler for a richer detail DTO, or `false` to omit the route.
	 */
	detail?: false | { response: R; handle: (id: number) => Promise<z.output<R>> }
}

// ─── Factory ───

/**
 * Standard `/list`, `/detail`, `/create`, `/update`, `/remove` endpoints for one entity.
 * Slice-specific routes chain onto the returned instance (RBAC `permission` macro included).
 */
export function crudRoutes<
	F extends z.ZodType,
	D extends z.ZodType,
	C extends z.ZodType,
	U extends z.ZodType,
	R extends z.ZodType = D,
>(config: CrudRouteConfig<F, D, C, U, R>) {
	const { prefix, resource } = config
	// The generic signature ties the service to the schemas' outputs at the call site. Elysia
	// cannot resolve schema types for type parameters, so routes are built against the erased
	// shapes (method params are bivariant); request validation keeps the runtime contract.
	const service: CrudRouteService<unknown, unknown, unknown, unknown> = config.service
	const schemas: Record<'filter' | 'dto' | 'create' | 'update', z.ZodType> = config.schemas
	const detail:
		| false
		| { response: z.ZodType; handle: (id: number) => Promise<unknown> }
		| undefined = config.detail
	const app = new Elysia({ prefix, tags: config.tags ?? [resource] })
		.use(rbac.as('scoped'))
		.get('/list', async ({ query }) => res.paginated(await service.handleList(query)), {
			query: schemas.filter,
			response: zRes.paginated(schemas.dto),
			permission: `${resource}.read`,
		})

	// Elysia methods register on the instance, so the optional route is added in place.
	if (detail) {
		app.get('/detail', async ({ query }) => res.ok(await detail.handle(query.id)), {
			query: zq.recordId,
			response: zRes.ok(detail.response),
			permission: `${resource}.read`,
		})
	} else if (detail === undefined) {
		app.get('/detail', async ({ query }) => res.ok(await service.handleGetById(query.id)), {
			query: zq.recordId,
			response: zRes.ok(schemas.dto),
			permission: `${resource}.read`,
		})
	}

	return app
		.post(
			'/create',
			async ({ body, auth }) => res.created(await service.handleCreate(body, actorOf(auth))),
			{
				body: schemas.create,
				response: zRes.created(EntityRefDto),
				permission: `${resource}.create`,
			},
		)
		.put(
			'/update',
			async ({ body, auth }) => res.ok(await service.handleUpdate(body, actorOf(auth))),
			{
				body: schemas.update,
				response: zRes.ok(EntityRefDto),
				permission: `${resource}.update`,
			},
		)
		.delete(
			'/remove',
			async ({ query, auth }) => res.ok(await service.handleDelete(query.id, actorOf(auth))),
			{
				query: zq.recordId,
				response: zRes.ok(EntityRefDto),
				permission: `${resource}.delete`,
			},
		)
}
