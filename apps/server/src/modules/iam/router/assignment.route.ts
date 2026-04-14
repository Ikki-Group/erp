import Elysia from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createSuccessResponseSchema } from '@/core/validation'

import * as dto from '../dto/user-assignment.dto'
import type { UserAssignmentService } from '../service/user-assignment.service'

/**
 * User Assignment Module Route (Layer 1)
 */
export function initUserAssignmentRoute(service: UserAssignmentService) {
  return new Elysia({ prefix: '/assignment' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await service.findByUserId(query.userId!)
        return res.ok(result)
      },
      {
        query: dto.UserAssignmentFilterDto,
        response: createSuccessResponseSchema(dto.UserAssignmentDetailDto.array()),
        auth: true,
      },
    )
    .post(
      '/assign',
      async function assign({ body, auth }) {
        await service.handleAssign(body, auth.userId)
        return res.ok({ success: true })
      },
      {
        body: dto.UserAssignmentBaseDto.omit({ isDefault: true }),
        response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
        auth: true,
      },
    )
    .delete(
      '/remove',
      async function remove({ body }) {
        await service.handleRemove(body.userId, body.locationId)
        return res.ok({ success: true })
      },
      {
        body: dto.UserAssignmentBaseDto.omit({ isDefault: true, roleId: true }),
        response: createSuccessResponseSchema(z.object({ success: z.boolean() })),
        auth: true,
      },
    )
}
