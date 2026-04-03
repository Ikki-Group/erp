import Elysia from 'elysia'
import z from 'zod'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
  createPaginatedResponseSchema,
  createSuccessResponseSchema,
  zPaginationDto,
  zRecordIdDto,
} from '@/core/validation'

import {
  workOrderCompleteSchema,
  workOrderCreateSchema,
  workOrderFilterSchema,
  workOrderSchema,
  workOrderSelectSchema,
} from '../dto/work-order.dto'
import type { WorkOrderService } from '../service/work-order.service'

export const workOrderRouter = (service: WorkOrderService) =>
  new Elysia({ prefix: '/work-orders', detail: { tags: ['Production'] } })
    .use(authPluginMacro)
    .get(
      '/list',
      async ({ query }) => {
        const result = await service.handleList(query as any, query as any)
        return res.paginated(result)
      },
      {
        query: z.object({ ...workOrderFilterSchema.shape, ...zPaginationDto.shape }),
        response: createPaginatedResponseSchema(workOrderSelectSchema),
        auth: true,
      },
    )
    .get(
      '/detail',
      async ({ query }) => {
        const wo = await service.handleDetail(query.id)
        return res.ok(wo)
      },
      {
        query: zRecordIdDto,
        response: createSuccessResponseSchema(workOrderSchema),
        auth: true,
      },
    )
    .post(
      '/create',
      async ({ body, auth }) => {
        const result = await service.handleCreate(body as any, auth.userId)
        return res.created(result)
      },
      {
        body: workOrderCreateSchema,
        response: createSuccessResponseSchema(workOrderSchema),
        auth: true,
      },
    )
    .post(
      '/start',
      async ({ query, auth }) => {
        const result = await service.handleStart(query.id, auth.userId)
        return res.ok(result)
      },
      {
        query: zRecordIdDto,
        response: createSuccessResponseSchema(workOrderSchema),
        auth: true,
      },
    )
    .post(
      '/complete',
      async ({ body, auth }) => {
        const result = await service.handleComplete(body.id, body, auth.userId)
        return res.ok(result)
      },
      {
        body: workOrderCompleteSchema,
        response: createSuccessResponseSchema(workOrderSchema),
        auth: true,
      },
    )
