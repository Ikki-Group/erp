import { Elysia } from 'elysia'
import { z } from 'zod'

import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
import { zRes } from '@/shared/http/response.schema.ts'
import { res } from '@/shared/http/response.ts'
import { EntityRefDto, zq } from '@/shared/schema/index.ts'

import {
	ConvertRequestDto,
	ConvertResponseDto,
	UomConversionCreateDto,
	UomConversionDto,
	UomCreateDto,
	UomDto,
	UomFilterDto,
	UomUpdateDto,
} from './uom.contract.ts'
import type { UomService } from './uom.service.ts'

// ─── Route Factory ───

export function createUomRoute(service: UomService) {
	return (
		new Elysia({ prefix: '/uom', tags: ['uom'] })
			.use(authPluginMacro)
			// ─── UoM CRUD ───
			.get(
				'/list',
				async ({ query }) => {
					const result = await service.handleList(query)
					return res.paginated(result)
				},
				{ query: UomFilterDto, response: zRes.paginated(UomDto) },
			)
			.get(
				'/detail',
				async ({ query }) => {
					const result = await service.handleGetById(query.id)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(UomDto) },
			)
			.post(
				'/create',
				async ({ body, auth }) => {
					const result = await service.handleCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: UomCreateDto, response: zRes.created(EntityRefDto) },
			)
			.put(
				'/update',
				async ({ body, auth }) => {
					const result = await service.handleUpdate(body, auth.userId)
					return res.ok(result)
				},
				{ body: UomUpdateDto, response: zRes.ok(EntityRefDto) },
			)
			.delete(
				'/remove',
				async ({ query, auth }) => {
					const result = await service.handleDelete(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)
			// ─── Conversion CRUD ───
			.get(
				'/conversion/list',
				async () => {
					const result = await service.handleConversionList()
					return res.ok(result)
				},
				{ response: zRes.ok(z.array(UomConversionDto)) },
			)
			.post(
				'/conversion/create',
				async ({ body, auth }) => {
					const result = await service.handleConversionCreate(body, auth.userId)
					return res.created(result)
				},
				{ body: UomConversionCreateDto, response: zRes.created(EntityRefDto) },
			)
			.delete(
				'/conversion/remove',
				async ({ query, auth }) => {
					const result = await service.handleConversionRemove(query.id, auth.userId)
					return res.ok(result)
				},
				{ query: zq.recordId, response: zRes.ok(EntityRefDto) },
			)
			// ─── Convert Utility ───
			.post(
				'/convert',
				async ({ body }) => {
					const result = await service.handleConvert(body)
					return res.ok(result)
				},
				{ body: ConvertRequestDto, response: zRes.ok(ConvertResponseDto) },
			)
	)
}
