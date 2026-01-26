import { Elysia } from "elysia"
import { logger } from "@/utils/logger"

/**
 * Request/Response logging plugin
 * Logs incoming requests and outgoing responses with timing
 */
export const loggerPlugin = new Elysia({ name: "Logger" })
  .derive({ as: "global" }, () => ({
    startTime: performance.now(),
  }))
  .onBeforeHandle({ as: "global" }, ({ request }) => {
    const requestId = request.headers.get("x-request-id") ?? "unknown"
    logger.info(
      {
        requestId,
        method: request.method,
        url: request.url,
        userAgent: request.headers.get("user-agent"),
      },
      "Incoming request",
    )
  })
  .onAfterHandle({ as: "global" }, ({ request, startTime, set }) => {
    const duration = performance.now() - startTime
    const requestId = request.headers.get("x-request-id") ?? "unknown"

    logger.info(
      {
        requestId,
        method: request.method,
        url: request.url,
        status: set.status ?? 200,
        durationMs: duration.toFixed(2),
      },
      "Request completed",
    )
  })
  .onError({ as: "global" }, ({ request, error, startTime }) => {
    const duration = startTime ? performance.now() - startTime : 0
    const requestId = request.headers.get("x-request-id") ?? "unknown"

    logger.error(
      {
        requestId,
        method: request.method,
        url: request.url,
        error: "message" in error ? String(error.message) : "Unknown error",
        durationMs: duration.toFixed(2),
      },
      "Request failed",
    )
  })
