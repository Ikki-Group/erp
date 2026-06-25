import { z } from 'zod'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import {
	MokaConfigurationCreateDto,
	MokaConfigurationOutputDto,
	MokaConfigurationUpdateDto,
} from './configuration.contract'
import type { MokaConfigurationService } from './configuration.service'

export function initMokaConfigurationRoute(service: MokaConfigurationService) {
	return new Elysia({ prefix: '/config' })
		.use(authPluginMacro)
		.get(
			'/by-location',
			async function findByLocationId(context) {
				const result = await service.findByLocationId(context.query.locationId)
				if (!result) return res.ok(null)
				return res.ok(MokaConfigurationOutputDto.parse(result))
			},
			{ query: z.object({ locationId: z.coerce.number() }), auth: true },
		)
		.post(
			'/create',
			async function create(context) {
				const result = await service.handleCreate(context.body, context.auth.userId)
				return res.created(result)
			},
			{ body: MokaConfigurationCreateDto, auth: true },
		)
		.put(
			'/update',
			async function update(context) {
				const result = await service.handleUpdate(context.query.id, context.body, context.auth.userId)
				return res.ok(result)
			},
			{ query: z.object({ id: z.coerce.number() }), body: MokaConfigurationUpdateDto, auth: true },
		)
}
