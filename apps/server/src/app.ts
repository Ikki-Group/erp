import { cors } from "@elysiajs/cors"
import { fromTypes, openapi } from "@elysiajs/openapi"
import { Elysia } from "elysia"
import { z } from "zod"

import { config } from "@/core/config"

import { otel } from "@/utils/otel"

export const app = new Elysia({ name: "App" })
  .use(cors())
  .use(otel)

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
      },
    }),
  )

export type App = typeof app
