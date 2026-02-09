import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { edenQuery } from './eden-query'

// Example usage
export const userQueries = {
  // Get by ID
  detail: edenQuery(['users', 'detail'], (params: { id: number }) =>
    api.iam.users.access.get({ query: { id: params.id } }),
  ),
}
