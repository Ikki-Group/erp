import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto, zc, zq } from '@/shared/schema'

import {
	CompanySettingsDto,
	CompanySettingsCreateDto,
	CompanySettingsUpdateDto,
} from './company-settings.contract'
import type { CompanySettingsService } from './company-settings.service'

export function createCompanySettingsRoute(service: CompanySettingsService) {
	return new Elysia({ prefix: '/settings' })
		.use(authPluginMacro)
		.get(
			'/',
			async () => {
				const result = await service.handleGet()
				return res.ok(result)
			},
			{
				response: createSuccessResponseDto(CompanySettingsDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(CompanySettingsDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: CompanySettingsCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async ({ body, auth }) => {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: CompanySettingsUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
