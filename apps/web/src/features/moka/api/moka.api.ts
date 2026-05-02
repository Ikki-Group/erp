import { z } from 'zod'

import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@/lib/validation'

import {
	MokaConfigurationCreateDto,
	MokaConfigurationOutputDto,
	MokaConfigurationUpdateDto,
} from '../dto/moka-configuration.dto'
import { MokaScrapHistoryDto } from '../dto/moka-scrap-history.dto'
import { MokaTriggerInputDto } from '../dto/moka.dto'

export const mokaApi = {
	configurationByLocation: apiFactory({
		method: 'get',
		url: endpoint.moka.configuration.byLocation,
		params: z.object({ locationId: z.coerce.number() }),
		result: createSuccessResponseSchema(MokaConfigurationOutputDto),
	}),
	createConfiguration: apiFactory({
		method: 'post',
		url: endpoint.moka.configuration.create,
		body: MokaConfigurationCreateDto,
		result: createSuccessResponseSchema(MokaConfigurationOutputDto),
		invalidates: [endpoint.moka.configuration.byLocation],
	}),
	updateConfiguration: apiFactory({
		method: 'put',
		url: endpoint.moka.configuration.update,
		params: z.object({ id: z.coerce.number() }),
		body: MokaConfigurationUpdateDto,
		result: createSuccessResponseSchema(MokaConfigurationOutputDto),
		invalidates: [endpoint.moka.configuration.byLocation],
	}),
	scrapHistory: apiFactory({
		method: 'get',
		url: endpoint.moka.scrap.history,
		params: z.object({ mokaConfigurationId: z.coerce.number().optional() }),
		result: createSuccessResponseSchema(z.array(MokaScrapHistoryDto)),
	}),
	triggerScrap: apiFactory({
		method: 'post',
		url: endpoint.moka.scrap.trigger,
		body: MokaTriggerInputDto,
		result: createSuccessResponseSchema(z.any()),
		invalidates: [endpoint.moka.scrap.history],
	}),
}
