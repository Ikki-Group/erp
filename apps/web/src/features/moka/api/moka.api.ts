import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { zc, createPaginatedResponseSchema, createSuccessResponseSchema } from '@/lib/validation'

import {
	MokaConfigurationCreateDto,
	MokaConfigurationDto,
	MokaConfigurationUpdateDto,
} from '../dto/moka-configuration.dto'
import { MokaScrapHistoryDto, MokaScrapHistoryFilterDto } from '../dto/moka-scrap-history.dto'
import { MokaTriggerInputDto, MokaTriggerResultDto } from '../dto/moka.dto'

export const mokaApi = {
	listConfiguration: apiFactory({
		method: 'get',
		url: endpoint.moka.configuration.list,
		result: createPaginatedResponseSchema(MokaConfigurationDto),
	}),
	detailConfiguration: apiFactory({
		method: 'get',
		url: endpoint.moka.configuration.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(MokaConfigurationDto),
	}),
	createConfiguration: apiFactory({
		method: 'post',
		url: endpoint.moka.configuration.create,
		body: MokaConfigurationCreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.moka.configuration.list],
	}),
	updateConfiguration: apiFactory({
		method: 'patch',
		url: endpoint.moka.configuration.update,
		body: MokaConfigurationUpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.moka.configuration.list, endpoint.moka.configuration.detail],
	}),
	removeConfiguration: apiFactory({
		method: 'delete',
		url: endpoint.moka.configuration.remove,
		params: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [endpoint.moka.configuration.list],
	}),
	scrapHistory: apiFactory({
		method: 'get',
		url: endpoint.moka.scrap.history,
		params: MokaScrapHistoryFilterDto,
		result: createSuccessResponseSchema(z.array(MokaScrapHistoryDto)),
	}),
	triggerScrap: apiFactory({
		method: 'post',
		url: endpoint.moka.scrap.trigger,
		body: MokaTriggerInputDto,
		result: createSuccessResponseSchema(MokaTriggerResultDto),
		invalidates: [endpoint.moka.scrap.history],
	}),
}
