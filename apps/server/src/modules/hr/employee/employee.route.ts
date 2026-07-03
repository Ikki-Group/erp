import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc, zq } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './employee.contract'
import type { EmployeeService } from './employee.service'

export function initEmployeeRoute(service: EmployeeService) {
	return new Elysia({ prefix: '/employee' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
				return res.paginated(result)
			},
			{
				query: dto.EmployeeFilterDto,
				response: createPaginatedResponseDto(dto.EmployeeDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail(context) {
				const result = await service.handleDetail(context.query.id)
				return res.ok(result)
			},
			{ query: zq.recordId, response: createSuccessResponseDto(dto.EmployeeDto), auth: true },
		)
		.post(
			'/create',
			async function create(context) {
				const result = await service.handleCreate(context.body, context.auth.userId)
				return res.created(result)
			},
			{
				body: dto.EmployeeCreateDto,
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
				body: dto.EmployeeUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove(context) {
				const result = await service.handleRemove(context.query.id, context.auth.userId)
				return res.ok(result)
			},
			{ query: zq.recordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
