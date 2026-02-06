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

export type App = typeof app
