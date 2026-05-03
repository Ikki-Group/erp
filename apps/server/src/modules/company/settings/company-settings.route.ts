import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import * as dto from './company-settings.dto'
import type { CompanySettingsService } from './company-settings.service'
import { createSuccessResponseSchema, zc, zq } from '@/lib/validation'

export function initCompanySettingsRoute(service: CompanySettingsService) {
	return new Elysia({ prefix: '/settings' })
		.use(authPluginMacro)
		.get(
			'/',
			async function get() {
				const result = await service.handleGet()
				return res.ok(result)
			},
			{
				response: createSuccessResponseSchema(dto.CompanySettingsDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseSchema(dto.CompanySettingsDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.CompanySettingsCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.CompanySettingsUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}
