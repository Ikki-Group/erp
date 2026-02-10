import { cors } from '@elysiajs/cors'
import { Elysia, redirect } from 'elysia'

import { authPlugin } from '@/lib/elysia/auth-plugin'
import { openapiPlugin } from '@/lib/elysia/openapi-plugin'
import { HttpError } from '@/lib/error/http'
import { otel } from '@/lib/otel'
import { IamServiceModule, initIamRouteModule } from '@/modules/iam'
import { initLocationsRouteModule, LocationServiceModule } from '@/modules/locations'
import { initMasterRouteModule, MasterServiceModule } from '@/modules/master'

// Services
const iamService = new IamServiceModule()
const locationService = new LocationServiceModule()
const masterService = new MasterServiceModule()

// Routes
const iamRoute = initIamRouteModule(iamService)
const locationsRoute = initLocationsRouteModule(locationService)
const masterRoute = initMasterRouteModule(masterService)

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
  .use(masterRoute)

export type App = typeof app
