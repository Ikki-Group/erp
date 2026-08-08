import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { res } from '@/shared/http/response.ts'
import { zq } from '@/shared/schema/index.ts'

import {
	ConvertRequestDto,
	UomConversionCreateDto,
	UomCreateDto,
	UomFilterDto,
	UomUpdateDto,
} from './uom.contract.ts'

import type { UomService } from './uom.service.ts'

// ─── Route Factory ───

export function createUomRoute(service: UomService) {
	return new Elysia({ prefix: '/uom' })
		.use(authPluginMacro)
		// ─── UoM CRUD ───
		.get('/list', async ({ query }) => {
			const result = await service.handleList(query)
			return res.paginated(result)
		}, { query: UomFilterDto })
		.get('/detail', async ({ query }) => {
			const result = await service.handleGetById(query.id)
			return res.ok(result)
		}, { query: zq.recordId })
		.post('/create', async ({ body, auth }) => {
			const result = await service.handleCreate(body, auth.userId)
			return res.created(result)
		}, { body: UomCreateDto })
		.put('/update', async ({ body, auth }) => {
			const result = await service.handleUpdate(body, auth.userId)
			return res.ok(result)
		}, { body: UomUpdateDto })
		.delete('/remove', async ({ query, auth }) => {
			const result = await service.handleDelete(query.id, auth.userId)
			return res.ok(result)
		}, { query: zq.recordId })
		// ─── Conversion CRUD ───
		.get('/conversion/list', async () => {
			const result = await service.handleConversionList()
			return res.ok(result)
		})
		.post('/conversion/create', async ({ body, auth }) => {
			const result = await service.handleConversionCreate(body, auth.userId)
			return res.created(result)
		}, { body: UomConversionCreateDto })
		.delete('/conversion/remove', async ({ query, auth }) => {
			const result = await service.handleConversionRemove(query.id, auth.userId)
			return res.ok(result)
		}, { query: zq.recordId })
		// ─── Convert Utility ───
		.post('/convert', async ({ body }) => {
			const result = await service.handleConvert(body)
			return res.ok(result)
		}, { body: ConvertRequestDto })
}
