import { cors } from '@elysiajs/cors'
import { elysiaLogger } from '@logtape/elysia'
import { Elysia, ValidationError } from 'elysia'

import { BadRequestError, HttpError, InternalServerError } from '@/lib/error/http'
import { logger } from '@/lib/logger'
import { otel } from '@/lib/otel'

import { IamServiceModule, initIamRouteModule } from '@/modules/iam'

// Services
const iamService = new IamServiceModule()
// const locationService = new LocationServiceModule()
// const dashboardService = new DashboardServiceModule(iamService, locationService)
// const materialService = new MaterialServiceModule()

// Routes
const iamRoute = initIamRouteModule(iamService)
// const locationsRoute = initLocationRouteModule(locationService)
// const dashboardRoute = initDashboardRouteModule(dashboardService)
// const materialsRoute = initMaterialsRouteModule(materialService)

export const app = new Elysia({
  name: 'App',
  precompile: true,
})
  .onError((ctx) => {
    let error: HttpError
    if (ctx.error instanceof HttpError) {
      error = ctx.error
    } else if (ctx.error instanceof ValidationError) {
      error = new BadRequestError('Invalid request', 'INVALID_REQUEST', {
        message: ctx.error.cause,
        fields: ctx.error.all,
      })
    } else {
      error = new InternalServerError('Internal server error', 'INTERNAL_SERVER_ERROR', ctx.error)
    }

    ctx.set.status = error.statusCode
    logger.withError(ctx.error).error(error.message)
    return error.toJSON()
  })
  .use(cors())
  .use(
    elysiaLogger({
      level: 'info',
      format: 'dev',
      logRequest: true,
      scope: 'global',
      category: 'request',
    })
  )
  .use(otel)
  // .use(createAuthPlugin(iamService))
  .use(iamRoute)
// .use(locationsRoute)
// .use(dashboardRoute)
// .use(materialsRoute)
// Must be last
// .get('/', () => redirect('/openapi'), {
//   detail: { hide: true },
// })
// .use(openapiPlugin)

export type App = typeof app
