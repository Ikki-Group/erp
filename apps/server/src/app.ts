import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { openapiPlugin } from '@/lib/elysia/openapi-plugin'
import { otel } from '@/lib/otel'
import { IamService, initIamRoute } from '@/modules/iam'

// Services
const iamService = new IamService()

// Routes
const iamRoute = initIamRoute(iamService)

export const app = new Elysia({
  name: 'App',
  precompile: true,
})
  .use(cors())
  .use(otel)
  .use(openapiPlugin)
  .use(iamRoute)
// .onError(({ code, error, set }) => {
//   const errorMessage = error instanceof Error ? error.message : String(error)
//   const errorStack =
//     error instanceof Error ? (process.env.NODE_ENV === 'development' ? error.stack : undefined) : undefined

//   // Handle custom HTTP errors
//   if (error instanceof HttpError) {
//     set.status = error.statusCode
//     return error.toJSON()
//   }

//   // Handle validation errors
//   if (code === 'VALIDATION') {
//     set.status = 422
//     return errorResponse('VALIDATION_ERROR', 'Validation failed', {
//       errors: error.all,
//     })
//   }

//   // Handle not found errors
//   if (code === 'NOT_FOUND') {
//     set.status = 404
//     return errorResponse('NOT_FOUND', 'Route not found')
//   }

//   // Handle internal server errors
//   set.status = 500
//   return errorResponse(
//     'INTERNAL_ERROR',
//     process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
//     undefined,
//     errorStack
//   )
// })
// .use(iamController)
// .use(locationController)
// .use(uomsController)
// .use(materialsController)
// .use(locationMaterialsController)

export type App = typeof app
