import { cors } from '@elysiajs/cors'
import { authPlugin } from '@server/lib/elysia/auth-plugin'
import { openapiPlugin } from '@server/lib/elysia/openapi-plugin'
import { HttpError } from '@server/lib/error/http'
import { otel } from '@server/lib/otel'
import { buildIamRoute, IamModuleService } from '@server/modules/iam'
import { buildLocationsRoute, LocationsModuleService } from '@server/modules/locations'
import { buildMaterialsRouter } from '@server/modules/materials'
import { Elysia, redirect } from 'elysia'

// Services
const iamModuleService = new IamModuleService()
const locationsModuleService = new LocationsModuleService()

// Routes
const iamRoute = buildIamRoute(iamModuleService)
const locationsRoute = buildLocationsRoute(locationsModuleService)
const materialsRoute = buildMaterialsRouter()

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
  .use(authPlugin)
  .get('/', redirect('/openapi'), {
    detail: { hide: true },
  })
  .use(iamRoute)
  .use(locationsRoute)
  .use(materialsRoute)

export type App = typeof app
