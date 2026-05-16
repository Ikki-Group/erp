import { createSuccessResponseSchema, zc, zq } from '@ikki/api-contract/validation'
import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import {
	CompanySettingsSchema,
	CompanySettingsCreateSchema,
	CompanySettingsUpdateSchema,
} from './company-settings.schema'
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
				response: createSuccessResponseSchema(CompanySettingsSchema),
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
				response: createSuccessResponseSchema(CompanySettingsSchema),
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
				body: CompanySettingsCreateSchema,
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
				body: CompanySettingsUpdateSchema,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
}
