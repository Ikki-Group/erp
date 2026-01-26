import { cors } from "@elysiajs/cors"
import { fromTypes, openapi } from "@elysiajs/openapi"
import { Elysia } from "elysia"
import { z } from "zod"

import { config } from "@/core/config"
import { errorHandler } from "@/core/errors"

import { requestIdPlugin, loggerPlugin } from "@/common/plugins"
import { success } from "@/common/models"

import { otel } from "@/utils/otel"

import { authController } from "@/modules"

export const app = new Elysia({ name: "App" })

  // Core plugins
  .use(cors())
  .use(otel)
  .use(errorHandler)
  .use(requestIdPlugin)
  .use(loggerPlugin)

  // OpenAPI documentation
  .use(
    openapi({
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
      references: fromTypes(
        config.NODE_ENV === "production"
          ? "dist/src/index.d.ts"
          : "src/index.ts",
      ),
      documentation: {
        info: {
          title: "Ikki ERP API",
          version: "0.0.1",
          description: "Enterprise Resource Planning API",
        },
        tags: [
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Health", description: "Health check endpoints" },
        ],
      },
    }),
  )

  // Health check
  .get(
    "/",
    () =>
      success({
        status: "ok",
        name: config.APP_NAME,
        timestamp: new Date().toISOString(),
      }),
    {
      tags: ["Health"],
      detail: {
        summary: "Health check",
        description: "API health check endpoint",
      },
    },
  )

  // API modules
  .group("/api/v1", (api) => api.use(authController))

export type App = typeof app
