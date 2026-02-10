import { cors } from '@elysiajs/cors'
import { Elysia, redirect } from 'elysia'

import { authPlugin } from '@/lib/elysia/auth-plugin'
import { openapiPlugin } from '@/lib/elysia/openapi-plugin'
import { HttpError } from '@/lib/error/http'
import { otel } from '@/lib/otel'
import { buildIamRoute, IamService } from '@/modules/iam'
import { buildLocationsRoute, LocationsModuleService } from '@/modules/locations'

// Services
const iamService = new IamService()
const locationsModuleService = new LocationsModuleService()

// Routes
const iamRoute = buildIamRoute(iamService)
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
