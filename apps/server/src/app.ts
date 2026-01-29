import { cors } from "@elysiajs/cors"
import { Elysia } from "elysia"

import { config } from "@/core/config"
import { HttpError } from "@/core/errors/http.error"
import { errorResponse } from "@/shared/dto"

import { otel } from "@/core/otel"
import { logger } from "@/utils/logger"
import { openapiConfig } from "@/core/openapi"

// Import modules
import { iamController } from "@/modules/iam"

export const app = new Elysia({ name: "App" })
  .use(cors())
  .use(otel)

  // OpenAPI documentation
  .use(openapiConfig)

  // Register modules
  .use(iamController)

  // Global error handler
  .onError(({ code, error, set }) => {
    // Type guards for error properties
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    logger.error(
      { code, error: errorMessage, stack: errorStack },
      "Error occurred",
    )

    if (error instanceof HttpError) {
      set.status = error.statusCode
      return error.toJSON()
    }

    // Handle validation errors
    if (code === "VALIDATION") {
      set.status = 422
      return errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
        validation: errorMessage,
      })
    }

    // Handle  not found errors
    if (code === "NOT_FOUND") {
      set.status = 404
      return errorResponse("NOT_FOUND", "Route not found", 404)
    }

    // Generic error
    set.status = 500
    return errorResponse(
      "INTERNAL_ERROR",
      config.NODE_ENV === "development"
        ? errorMessage
        : "Internal server error",
      500,
    )
  })

export type App = typeof app
