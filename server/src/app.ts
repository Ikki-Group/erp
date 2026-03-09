import { cors } from '@elysiajs/cors'
import { Elysia, ValidationError } from 'elysia'

import { createAuthPlugin } from '@/lib/elysia/auth-plugin'
import { requestIdPlugin } from '@/lib/elysia/request-id'
import { BadRequestError, HttpError, InternalServerError, NotFoundError } from '@/lib/error/http'
import { logger } from '@/lib/logger'
import { otel } from '@/lib/otel'

import { DashboardServiceModule, initDashboardRouteModule } from '@/modules/dashboard'
import { IamServiceModule, initIamRouteModule } from '@/modules/iam'
import { initInventoryRouteModule, InventoryServiceModule } from '@/modules/inventory'
import { initLocationRouteModule, LocationServiceModule } from '@/modules/location'
import { initMaterialsRouteModule, MaterialServiceModule } from '@/modules/materials'
import { initProductRouteModule, ProductServiceModule } from '@/modules/product'
import { initRecipeRouteModule, RecipeServiceModule } from '@/modules/recipe'
import { initToolRouteModule, ToolServiceModule } from '@/modules/tool'

import { env } from './config/env'

// Services
const locationService = new LocationServiceModule()
const iamService = new IamServiceModule(locationService)
const dashboardService = new DashboardServiceModule(iamService, locationService)
const materialService = new MaterialServiceModule(locationService)
const inventoryService = new InventoryServiceModule(materialService)
const productService = new ProductServiceModule()
const recipeService = new RecipeServiceModule()
const toolService = new ToolServiceModule(iamService, locationService, productService, materialService)

// Routes
const locationsRoute = initLocationRouteModule(locationService)
const iamRoute = initIamRouteModule(iamService)
const dashboardRoute = initDashboardRouteModule(dashboardService)
const toolRoute = initToolRouteModule(toolService)
const materialsRoute = initMaterialsRouteModule(materialService)
const inventoryRoute = initInventoryRouteModule(inventoryService)
const productRoute = initProductRouteModule(productService)
const recipeRoute = initRecipeRouteModule(recipeService)

if (env.NODE_ENV === 'development' && Bun.env.ENABLE_SEED === 'true') {
  await toolService.seed.seed()
}

export const app = new Elysia({
  name: 'App',
  precompile: true,
})
  .get('/', () => ({ status: 'ok', name: 'Ikki ERP API' }))
  .onRequest(({ request }) => {
    logger.info({ method: request.method, url: request.url }, 'Request received')
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
    } else if (ctx.code === 'NOT_FOUND') {
      error = new NotFoundError('Route not found', 'ROUTE_NOT_FOUND')
    } else {
      error = new InternalServerError('Internal server error', 'INTERNAL_SERVER_ERROR', ctx.error)
    }

    ctx.set.status = error.statusCode
    logger.error(
      {
        err: ctx.error,
        path: ctx.path,
        method: ctx.request.method,
      },
      error.message
    )
    return error.toJSON()
  })
  .use(cors())
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
  .use(recipeRoute)

