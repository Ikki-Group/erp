import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zRecordIdDto } from '@/core/validation'

import * as dto from '../dto/goods-receipt.dto'
import type { GoodsReceiptService } from '../service/goods-receipt.service'

/**
 * Goods Receipt Module Route (Layer 2)
 * Standard functional route pattern (Golden Path 2.1).
 */
export function initGoodsReceiptRoute(service: GoodsReceiptService) {
  return new Elysia({ prefix: '/goods-receipt' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await service.handleList(query)
        return res.paginated(result)
      },
      {
        query: dto.GoodsReceiptNoteFilterDto,
        response: createPaginatedResponseSchema(dto.GoodsReceiptNoteBaseDto),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const result = await service.handleDetail(query.id)
        return res.ok(result)
      },
      { query: zRecordIdDto, response: createSuccessResponseSchema(dto.GoodsReceiptNoteDto), auth: true },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const result = await service.handleCreate(body, auth.userId)
        return res.ok(result)
      },
      { body: dto.GoodsReceiptNoteCreateDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .post(
      '/complete',
      async function complete({ body, auth }) {
        const result = await service.handleComplete(body.id, auth.userId)
        return res.ok(result)
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .delete(
      '/remove',
      async function remove({ body, auth }) {
        const result = await service.handleRemove(body.id, auth.userId)
        return res.ok(result)
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
    .delete(
      '/hard-remove',
      async function hardRemove({ body }) {
        const result = await service.handleHardRemove(body.id)
        return res.ok(result)
      },
      { body: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
    )
}
