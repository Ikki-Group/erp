import Elysia from 'elysia'
import z from 'zod'

import { zSchema } from '@/lib/zod'

import type { IamUsersService } from '../service/users.service'

export function userRoute(s: IamUsersService) {
  return new Elysia()
    .get(
      '',
      async function getUsers({ query }) {
        return s.list({
          page: query.page,
          limit: query.limit,
          search: query.search,
          isActive: query.isActive === 'true',
        })
      },
      {
        query: z.object({
          search: z.string().optional(),
          isActive: z.enum(['true', 'false']).optional(),
          ...zSchema.pagination.shape,
        }),
      }
    )
    .get(
      '/:id',
      async function getUserById() {
        return {}
      },
      {
        params: z.object({
          id: z.number(),
        }),
        response: z.object({}),
      }
    )
    .post(
      '',
      async function createUser() {
        return {}
      },
      {
        response: z.object({}),
      }
    )
    .put(
      '/:id',
      async function updateUser() {
        return {}
      },
      {
        params: z.object({
          id: z.number(),
        }),
        response: z.object({}),
      }
    )
    .delete(
      '/:id',
      async function deleteUser() {
        return {}
      },
      {
        params: z.object({
          id: z.number(),
        }),
        response: z.object({}),
      }
    )
}
