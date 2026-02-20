import { cors } from '@elysiajs/cors'
import { Elysia, ValidationError } from 'elysia'

import { BadRequestError, HttpError, InternalServerError } from '@/lib/error/http'
import { otel } from '@/lib/otel'

import { IamServiceModule, initIamRouteModule } from '@/modules/iam'
import { initLocationRouteModule, LocationServiceModule } from '@/modules/location'
import { initMasterRouteModule, MasterServiceModule } from '@/modules/master'

// Services
const iamService = new IamServiceModule()
const locationService = new LocationServiceModule()
const masterService = new MasterServiceModule()

// Routes
const iamRoute = initIamRouteModule(iamService)
const locationsRoute = initLocationRouteModule(locationService)
const masterRoute = initMasterRouteModule(masterService)

export const app = new Elysia({
  name: 'App',
  precompile: true,
})
  .use(cors())
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
    return error.toJSON()
  })
  .use(otel)
  .use(iamRoute)
  .use(locationsRoute)
  .use(masterRoute)
// Must be last
// .get('/', () => redirect('/openapi'), {
//   detail: { hide: true },
// })
// .use(openapiPlugin)

export type App = typeof app
