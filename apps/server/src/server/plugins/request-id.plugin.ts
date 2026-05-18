import { context, trace } from '@opentelemetry/api'
import Elysia from 'elysia'

export function requestIdPlugin() {
	return new Elysia({ name: 'request-id' })
		.derive(({ request, set }) => {
			const upstreamId = request.headers.get('x-request-id')
			const span = trace.getSpan(context.active())
			const requestId = upstreamId ?? span?.spanContext().traceId ?? crypto.randomUUID()

			set.headers['X-Request-Id'] = requestId
			return { requestId }
		})
		.as('global')
}
