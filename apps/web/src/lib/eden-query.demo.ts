import { api } from './api'
import { edenQuery } from './eden-query'

export const demoQueries = {
  detail: edenQuery(['users', 'detail'], (params: { id: number }) =>
    api.iam.users.access.get({ query: { id: params.id } }),
  ),
}
