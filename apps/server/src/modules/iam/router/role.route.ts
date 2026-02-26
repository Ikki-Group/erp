import Elysia from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zHttp, zResponse, zSchema } from '@/lib/validation'

import { RoleCreateDto, RoleDto, RoleFilterDto, RoleUpdateDto } from '../schema'
import type { IamServiceModule } from '../service'

export function initRoleRoute(service: IamServiceModule) {
  return new Elysia()
    .get(
      '/list',
      async function list({ query }) {
        const { isSystem, search, page, limit } = query
        const result = await service.role.findPaginated({ isSystem, search }, { page, limit })
        return res.paginated(result)
      },
      {
        query: z.object({
          ...zHttp.pagination.shape,
          ...RoleFilterDto.shape,
        }),
        response: zResponse.paginated(RoleDto.array()),
      }
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const role = await service.role.findById(query.id)
        return res.ok(role)
      },
      {
        query: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(RoleDto),
      }
    )
    .post(
      '/create',
      async function create({ body }) {
        const { id } = await service.role.create(body)
        return res.created({ id }, 'ROLE_CREATED')
      },
      {
        body: RoleCreateDto,
        response: zResponse.ok(zSchema.recordId),
      }
    )
    .put(
      '/update',
      async function update({ body }) {
        const { id } = await service.role.update(body.id, body)
        return res.ok({ id }, 'ROLE_UPDATED')
      },
      {
        body: RoleUpdateDto,
        response: zResponse.ok(zSchema.recordId),
      }
    )
    .delete(
      '/remove',
      async function remove({ body }) {
        await service.role.delete(body.id)
        return res.ok({ id: body.id }, 'ROLE_REMOVED')
      },
      {
        body: z.object({ id: zHttp.query.idRequired }),
        response: zResponse.ok(zSchema.recordId),
      }
    )
}
