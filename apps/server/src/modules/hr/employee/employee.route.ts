import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { createPaginatedResponseDto, createSuccessResponseDto, zc, zq } from '@/shared/schema'

import {
	EmployeeCreateDto,
	EmployeeDto,
	EmployeeFilterDto,
	EmployeeUpdateDto,
} from './employee.contract'
import type { EmployeeModule } from './employee.module'

export function createEmployeeRoute(m: EmployeeModule) {
	return new Elysia({ prefix: '/employee' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleList(query)
				return res.paginated(result)
			},
			{
				query: EmployeeFilterDto,
				response: createPaginatedResponseDto(EmployeeDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const result = await m.handleGetById(query.id)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(EmployeeDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await m.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: EmployeeCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async ({ body, auth }) => {
				const result = await m.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{
				body: EmployeeUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query, auth }) => {
				const result = await m.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{
				query: zq.recordId,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
