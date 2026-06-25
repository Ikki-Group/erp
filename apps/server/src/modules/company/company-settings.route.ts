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
				response: createSuccessResponseDto(CompanySettingsDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail(context) {
				const result = await service.handleDetail(context.query.id)
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
			async function create(context) {
				const result = await service.handleCreate(context.body, context.auth.userId)
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
			async function update(context) {
				const result = await service.handleUpdate(context.body, context.auth.userId)
				return res.ok(result)
			},
			{
				body: CompanySettingsUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
