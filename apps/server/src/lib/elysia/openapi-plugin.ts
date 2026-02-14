import { openapi } from '@elysiajs/openapi'
import z from 'zod'

import { env } from '@/config/env'

/**
 * OpenAPI Plugin Configuration
 * Provides comprehensive API documentation with Swagger UI
 */
export const openapiPlugin = openapi({
  enabled: true,
  provider: 'scalar',
  // references: fromTypes('src/app.ts'),
  mapJsonSchema: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zod: (registry: any) => {
      return z.toJSONSchema(registry, {
        unrepresentable: 'any',
        override: (ctx) => {
          const def = ctx.zodSchema._zod.def
          if (def.type === 'date') {
            ctx.jsonSchema.type = 'string'
            ctx.jsonSchema.format = 'date-time'
            ctx.jsonSchema.example = '2022-01-01T00:00:00.000Z'
          }
        },
      })
    },
  },
  documentation: {
    openapi: '3.2.0',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    'x-tagGroups': [
      {
        name: 'IAM',
        tags: ['auth', 'users', 'roles', 'user-role-assignments'],
      },
    ],
    info: {
      title: 'Ikki ERP API',
      version: '1.0.0',
      description: 'Enterprise Resource Planning API - Comprehensive business management system',
      contact: {
        name: 'Ikki Group',
        email: 'support@ikki.com',
      },
    },
    servers: [
      {
        url: `http://${env.HOST}:${env.PORT}`,
        description: env.NODE_ENV === 'development' ? 'Development Server' : 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token authentication',
        },
      },
    },
  },
})
