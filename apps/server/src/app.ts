import { cors } from '@elysiajs/cors'
import { Elysia, redirect } from 'elysia'

import { openapiPlugin } from '@/lib/elysia/openapi-plugin'
import { HttpError } from '@/lib/error/http'
import { otel } from '@/lib/otel'
import { buildIamRoute, IamService } from '@/modules/iam'

// Services
const iamService = new IamService()

// Routes
const iamRoute = buildIamRoute(iamService)

export const app = new Elysia({
  name: 'App',
  precompile: true,
})
  .use(cors())
  .onError((ctx) => {
    if (ctx.error instanceof HttpError) {
      return ctx.error.toJSON()
    }

    return ctx.error
  })
  .use(otel)
  .use(openapiPlugin)
  .get('/', redirect('/openapi'), {
    detail: { hide: true },
  })
  .use(iamRoute)

export type App = typeof app
