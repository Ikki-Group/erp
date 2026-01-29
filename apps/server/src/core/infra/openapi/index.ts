import { openapi } from "@elysiajs/openapi"
import { z } from "zod"
import { config } from "@/core/config"

export const openapiConfig = openapi({
  mapJsonSchema: {
    zod: z.toJSONSchema,
  },
  // references: fromTypes(
  //   config.NODE_ENV === "production"
  //     ? "dist/src/index.d.ts"
  //     : "src/index.ts",
  // ),
  documentation: {
    info: {
      title: "Ikki ERP API",
      version: "0.0.1",
      description: "Enterprise Resource Planning API",
    },
  },
})
