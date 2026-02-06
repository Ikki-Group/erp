import Elysia from 'elysia'

import type { IamService } from '../service'
import { userRoute } from './user.route'

export function initIamRoute(s: IamService) {
  const userRouter = userRoute(s.users)
  return new Elysia({
    tags: ['iam'],
  }).group('/users', (g) => g.use(userRouter))
}
