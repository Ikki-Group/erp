import { Elysia } from 'elysia'

import { createAuthPlugin } from '@/lib/elysia/auth-plugin'

import type { IamServiceModule } from '../service'
import { initIamAuthRoute } from './iam-auth.route'
import { initIamRoleRoute } from './iam-role.route'
import { initIamUserRoute } from './iam-user.route'

export function initIamRouteModule(service: IamServiceModule) {
  const authRouter = initIamAuthRoute(service)
  const userRouter = initIamUserRoute(service)
  const roleRouter = initIamRoleRoute(service)

  return new Elysia({ prefix: '/iam' })
    .use(createAuthPlugin(service))
    .group('/auth', (g) => g.use(authRouter))
    .group('/user', (g) => g.use(userRouter))
    .group('/role', (g) => g.use(roleRouter))
}
