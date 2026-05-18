import { z } from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { res } from '@/core/http/response'

import { authPluginMacro } from '@/server/plugins/auth.plugin'

import {
	MokaConfigurationCreateDto,
	MokaConfigurationOutputDto,
	MokaConfigurationUpdateDto,
} from './configuration.dto'
import type { MokaConfigurationService } from './configuration.service'

export function initMokaConfigurationRoute(service: MokaConfigurationService) {
	return new Elysia({ prefix: '/config' })
		.use(authPluginMacro)
		.get(
			'/by-location',
			async function findByLocationId({ query }) {
				const result = await service.findByLocationId(query.locationId)
				if (!result) return res.ok(null)
				return res.ok(MokaConfigurationOutputDto.parse(result))
			},
			{ query: z.object({ locationId: z.coerce.number() }), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: MokaConfigurationCreateDto, auth: true },
		)
		.put(
			'/update',
			async function update({ query, body, auth }) {
				const result = await service.handleUpdate(query.id, body, auth.userId)
				return res.ok(result)
			},
			{ query: z.object({ id: z.coerce.number() }), body: MokaConfigurationUpdateDto, auth: true },
		)
}
