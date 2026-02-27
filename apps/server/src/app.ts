import { cors } from '@elysiajs/cors'
import { elysiaLogger } from '@logtape/elysia'
import { Elysia, ValidationError } from 'elysia'

import { createAuthPlugin } from '@/lib/elysia/auth-plugin'
import { BadRequestError, HttpError, InternalServerError } from '@/lib/error/http'
import { logger } from '@/lib/logger'
import { otel } from '@/lib/otel'

import { DashboardServiceModule, initDashboardRouteModule } from '@/modules/dashboard'
import { IamServiceModule, initIamRouteModule } from '@/modules/iam'
import { initInventoryRouteModule, InventoryServiceModule } from '@/modules/inventory'
import { initLocationRouteModule, LocationServiceModule } from '@/modules/location'
import { initMasterRouteModule, MasterServiceModule } from '@/modules/master'

// Services
const iamService = new IamServiceModule()
const inventoryService = new InventoryServiceModule()
const locationService = new LocationServiceModule()
const masterService = new MasterServiceModule()
const dashboardService = new DashboardServiceModule(iamService, locationService)

// Routes
const iamRoute = initIamRouteModule(iamService)
const inventoryRoute = initInventoryRouteModule(inventoryService)
const locationsRoute = initLocationRouteModule(locationService)
const masterRoute = initMasterRouteModule(masterService)
const dashboardRoute = initDashboardRouteModule(dashboardService)

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
  .use(createAuthPlugin(iamService))
  .use(iamRoute)
  .use(inventoryRoute)
  .use(locationsRoute)
  .use(masterRoute)
  .use(dashboardRoute)
// Must be last
// .get('/', () => redirect('/openapi'), {
//   detail: { hide: true },
// })
// .use(openapiPlugin)

export type App = typeof app
