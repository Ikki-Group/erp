import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zRecordIdDto,
} from '@/core/validation'

import * as dto from '../dto/employee.dto'
import type { EmployeeServiceModule } from '../service'

export function initEmployeeRoute(module: EmployeeServiceModule) {
	const service = module.employee
	return new Elysia({ prefix: '/employee' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query, query)
				return res.paginated(result)
			},
			{
				query: dto.EmployeeFilterDto,
				response: createPaginatedResponseSchema(dto.EmployeeDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: zRecordIdDto, response: createSuccessResponseSchema(dto.EmployeeDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.EmployeeCreateDto,
				response: createSuccessResponseSchema(zRecordIdDto),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const { id, ...data } = body
				const result = await service.handleUpdate(id, data, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.EmployeeUpdateDto,
				response: createSuccessResponseSchema(zRecordIdDto),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query, auth }) {
				const result = await service.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zRecordIdDto, response: createSuccessResponseSchema(zRecordIdDto), auth: true },
		)
}
