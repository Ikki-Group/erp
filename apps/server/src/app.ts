import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { iamController } from '@/features/iam'

import { HttpError } from '@/shared/errors/http.error'
import { otel } from '@/shared/otel'
import { errorResponse } from '@/shared/responses'
import { openapiPlugin } from '@/shared/server/openapi-plugin'

/**
 * Main Elysia application
 * Combines all controllers and middleware
 */
export const app = new Elysia({
  name: 'App',
  precompile: true,
})
  .use(cors())
  .use(otel)
  .use(openapiPlugin)
  .onError(({ code, error, set }) => {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack =
      error instanceof Error ? (process.env.NODE_ENV === 'development' ? error.stack : undefined) : undefined

    // Handle custom HTTP errors
    if (error instanceof HttpError) {
      set.status = error.statusCode
      return error.toJSON()
    }

    // Handle validation errors
    if (code === 'VALIDATION') {
      set.status = 422
      return errorResponse('VALIDATION_ERROR', 'Validation failed', {
        errors: error.all,
      })
    }

    // Handle not found errors
    if (code === 'NOT_FOUND') {
      set.status = 404
      return errorResponse('NOT_FOUND', 'Route not found')
    }

    // Handle internal server errors
    set.status = 500
    return errorResponse(
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
      undefined,
      errorStack
    )
  })
  .use(iamController)

export type App = typeof app
