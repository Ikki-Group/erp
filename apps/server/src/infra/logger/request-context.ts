import { withContext } from '@logtape/logtape'
import { Elysia } from 'elysia'

/**
 * Elysia plugin that wraps each request in a LogTape implicit context.
 * All logs emitted within the request lifecycle automatically include:
 * - requestId (from header or generated)
 * - userId (from auth, if resolved)
 * - locationId (from auth, if resolved)
 *
 * Must be applied AFTER authPlugin so `auth` is available on the context.
 */
export const loggerContextPlugin = new Elysia({ name: 'logger-context' }).derive(
	{ as: 'scoped' },
	({ request }) => {
		const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()
		return { requestId }
	},
)

/**
 * Helper to wrap a route handler body with implicit log context.
 * Call this inside route handlers that need requestId/userId/locationId
 * automatically attached to all logs in the call tree.
 *
 * Usage:
 * ```ts
 * .post('/order/complete', (ctx) =>
 *   withLogContext(ctx, () => service.handleComplete(ctx.body, ctx.auth.userId))
 * )
 * ```
 */
export function withLogContext<T>(
	ctx: { requestId: string; auth?: { userId: number; locationId: number | null } },
	fn: () => T,
): T {
	return withContext(
		{
			requestId: ctx.requestId,
			...(ctx.auth && {
				userId: ctx.auth.userId,
				locationId: ctx.auth.locationId,
			}),
		},
		fn,
	)
}
