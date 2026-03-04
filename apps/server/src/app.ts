import { cors } from '@elysiajs/cors'
import { elysiaLogger } from '@logtape/elysia'
import { Elysia, ValidationError } from 'elysia'

import { createAuthPlugin } from '@/lib/elysia/auth-plugin'
import { requestIdPlugin } from '@/lib/elysia/request-id'
import { BadRequestError, HttpError, InternalServerError } from '@/lib/error/http'
import { logger } from '@/lib/logger'
import { otel } from '@/lib/otel'

import { DashboardServiceModule, initDashboardRouteModule } from '@/modules/dashboard'
import { IamServiceModule, initIamRouteModule } from '@/modules/iam'
import { initInventoryRouteModule, InventoryServiceModule } from '@/modules/inventory'
import { initLocationRouteModule, LocationServiceModule } from '@/modules/location'
import { initMaterialsRouteModule, MaterialServiceModule } from '@/modules/materials'
import { initProductRouteModule, ProductServiceModule } from '@/modules/product'
import { initToolRouteModule, ToolServiceModule } from '@/modules/tool'

// Services
const locationService = new LocationServiceModule()
const iamService = new IamServiceModule(locationService)
const dashboardService = new DashboardServiceModule(iamService, locationService)
const toolService = new ToolServiceModule(iamService, locationService)
const materialService = new MaterialServiceModule(locationService)
const inventoryService = new InventoryServiceModule(materialService)
const productService = new ProductServiceModule()

// Routes
const locationsRoute = initLocationRouteModule(locationService)
const iamRoute = initIamRouteModule(iamService)
const dashboardRoute = initDashboardRouteModule(dashboardService)
const toolRoute = initToolRouteModule(toolService)
const materialsRoute = initMaterialsRouteModule(materialService)
const inventoryRoute = initInventoryRouteModule(inventoryService)
const productRoute = initProductRouteModule(productService)

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
  .use(createAuthPlugin(iamService))
  .use(iamRoute)
  .use(locationsRoute)
  .use(dashboardRoute)
  .use(toolRoute)
  .use(materialsRoute)
  .use(inventoryRoute)
  .use(productRoute)
// Must be last
// .get('/', () => redirect('/openapi'), {
//   detail: { hide: true },
// })
// .use(openapiPlugin)

export type App = typeof app
