import { Elysia } from "elysia"
import { logger } from "@/utils/logger"
import { error } from "@/common/models"
import { HttpError } from "./http.error"

export * from "./http.error"

/**
 * Global error handler plugin for Elysia
 * Converts all errors to standardized JSON responses
 */
export const errorHandler = new Elysia({ name: "ErrorHandler" }).onError(
  ({ error: err, set }) => {
    // Handle custom HTTP errors
    if (err instanceof HttpError) {
      set.status = err.statusCode
      return error(err.code ?? err.name, err.message, err.details)
    }

    // Handle Elysia validation errors
    if ("name" in err && err.name === "ValidationError") {
      set.status = 422
      return error("VALIDATION_ERROR", "Validation failed", {
        details: "message" in err ? String(err.message) : undefined,
      })
    }

    // Log unexpected errors
    if ("message" in err) {
      logger.error({ err }, "Unhandled error")
    }

    // Return generic error for unknown errors
    set.status = 500
    return error(
      "INTERNAL_ERROR",
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : "message" in err
          ? String(err.message)
          : "Unknown error",
    )
  },
)
