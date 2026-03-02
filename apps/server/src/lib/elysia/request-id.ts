import { context, trace } from '@opentelemetry/api'
import Elysia from 'elysia'

export function requestIdPlugin() {
  return new Elysia({
    name: 'request-id',
  })
    .derive(({ set }) => {
      const span = trace.getSpan(context.active())
      const requestId = span?.spanContext().traceId || ''

      // Set the header in the response context
      set.headers['X-Request-Id'] = requestId
    })
    .as('global')
}
