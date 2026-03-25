import z from 'zod'
import {
  MaterialLocationAssignDto,
  MaterialLocationConfigDto,
  MaterialLocationFilterDto,
  MaterialLocationStockDto,
  MaterialLocationUnassignDto,
  MaterialLocationWithLocationDto,
} from '../dto'
import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { zHttp, zSchema } from '@/lib/zod'

export const materialLocationApi = {
  /** Paginated stock list for a specific location */
  stock: apiFactory({
    method: 'get',
    url: endpoint.material.location.stock,
    params: z.object({
      ...zHttp.pagination.shape,
      ...MaterialLocationFilterDto.shape,
    }),
    result: zHttp.paginated(MaterialLocationStockDto.array()),
  }),

  /** Assign materials to a location (batch) */
  assign: apiFactory({
    method: 'post',
    url: endpoint.material.location.assign,
    body: MaterialLocationAssignDto,
    result: zHttp.ok(z.object({ assignedCount: z.number() })),
  }),

  /** Unassign a material from a location */
  unassign: apiFactory({
    method: 'delete',
    url: endpoint.material.location.unassign,
    params: MaterialLocationUnassignDto,
    result: zHttp.ok(zSchema.recordId),
  }),

  /** List locations assigned to a material */
  byMaterial: apiFactory({
    method: 'get',
    url: endpoint.material.location.byMaterial,
    params: zSchema.recordId,
    result: zHttp.ok(MaterialLocationWithLocationDto.array()),
  }),

  /** Update per-location config */
  updateConfig: apiFactory({
    method: 'put',
    url: endpoint.material.location.config,
    body: MaterialLocationConfigDto,
    result: zHttp.ok(zSchema.recordId),
  }),
}
