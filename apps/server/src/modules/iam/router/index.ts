import { Elysia } from 'elysia'

// import { createAuthPlugin } from '@/lib/elysia/auth-plugin'

import type { IamServiceModule } from '../service'

import { initUserRoute } from './user.route'

export function initIamRouteModule(s: IamServiceModule) {
  const userRouter = initUserRoute(s)

  return new Elysia({ prefix: '/iam' }).group('/user', (g) => g.use(userRouter))
}
