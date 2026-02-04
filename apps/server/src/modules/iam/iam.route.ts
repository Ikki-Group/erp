import Elysia from 'elysia'

import type { IamService } from './service'

export function initIamRoute(iamService: IamService) {
  return new Elysia({
    tags: ['IAM'],
  })
    .post('/users', iamService.users.create)
    .get('/users', iamService.users.list)
}
