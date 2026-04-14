import { z } from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory } from '@/lib/api'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zRecordIdDto } from '@/lib/zod'

import { MokaConfigurationDto } from '../dto/moka-configuration.dto'
import { MokaScrapHistoryDto } from '../dto/moka-scrap-history.dto'
import { MokaTriggerInputDto } from '../dto/moka.dto'

export const mokaApi = {
  listConfiguration: apiFactory({
    method: 'get',
    url: endpoint.moka.configuration.list,
    result: createPaginatedResponseSchema(MokaConfigurationDto),
  }),
  detailConfiguration: apiFactory({
    method: 'get',
    url: endpoint.moka.configuration.detail,
    params: zRecordIdDto,
    result: createSuccessResponseSchema(MokaConfigurationDto),
  }),
  createConfiguration: apiFactory({
    method: 'post',
    url: endpoint.moka.configuration.create,
    body: MokaConfigurationDto.omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true }),
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  updateConfiguration: apiFactory({
    method: 'patch',
    url: endpoint.moka.configuration.update,
    body: MokaConfigurationDto.omit({ createdAt: true, updatedAt: true, deletedAt: true }),
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  removeConfiguration: apiFactory({
    method: 'delete',
    url: endpoint.moka.configuration.remove,
    params: zRecordIdDto,
    result: createSuccessResponseSchema(zRecordIdDto),
  }),
  scrapHistory: apiFactory({
    method: 'get',
    url: endpoint.moka.scrap.history,
    params: z.object({ mokaConfigurationId: z.number().optional() }),
    result: createSuccessResponseSchema(z.array(MokaScrapHistoryDto)),
  }),
  triggerScrap: apiFactory({
    method: 'post',
    url: endpoint.moka.scrap.trigger,
    body: MokaTriggerInputDto,
    result: createSuccessResponseSchema(z.any()),
  }),
}
