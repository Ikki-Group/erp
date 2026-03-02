import { cors } from '@elysiajs/cors'
import { elysiaLogger } from '@logtape/elysia'
import { Elysia, ValidationError } from 'elysia'

import { requestIdPlugin } from '@/lib/elysia/request-id'
import { BadRequestError, HttpError, InternalServerError } from '@/lib/error/http'
import { logger } from '@/lib/logger'
import { otel } from '@/lib/otel'

import { DashboardServiceModule, initDashboardRouteModule } from '@/modules/dashboard'
import { IamServiceModule, initIamRouteModule } from '@/modules/iam'
import { initLocationRouteModule, LocationServiceModule } from '@/modules/location'

// Services
const iamService = new IamServiceModule()
const locationService = new LocationServiceModule()
const dashboardService = new DashboardServiceModule(iamService, locationService)
// const materialService = new MaterialServiceModule()

// Routes
const iamRoute = initIamRouteModule(iamService)
const locationsRoute = initLocationRouteModule(locationService)
const dashboardRoute = initDashboardRouteModule(dashboardService)
// const materialsRoute = initMaterialsRouteModule(materialService)

export const app = new Elysia({
  name: 'App',
  precompile: true,
})
  .onError((ctx) => {
    // eslint-disable-next-line no-console
    console.log(ctx.error)
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
  .use(requestIdPlugin())
  // .use(createAuthPlugin(iamService))
  .use(iamRoute)
  .use(locationsRoute)
  .use(dashboardRoute)
// .use(materialsRoute)
// Must be last
// .get('/', () => redirect('/openapi'), {
//   detail: { hide: true },
// })
// .use(openapiPlugin)

export type App = typeof app
