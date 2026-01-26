import { Elysia } from "elysia"

/**
 * Request ID plugin
 * Generates a unique request ID for each request for tracing
 */
export const requestIdPlugin = new Elysia({ name: "RequestId" })
  .derive({ as: "global" }, ({ request }) => {
    const existingId = request.headers.get("x-request-id")
    const requestId = existingId ?? crypto.randomUUID()

    return { requestId }
  })
  .onAfterHandle({ as: "global" }, ({ requestId, set }) => {
    set.headers["x-request-id"] = requestId
  })
