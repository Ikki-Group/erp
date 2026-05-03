import { Elysia } from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import * as dto from './role.dto'
import type { RoleService } from './role.service'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@/lib/validation'

export function initRoleRoute(service: RoleService) {
	return new Elysia({ prefix: '/role' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.RoleFilterDto,
				response: createPaginatedResponseSchema(dto.RoleDto),
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
				response: createSuccessResponseSchema(dto.RoleDto),
				auth: true,
			},
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.ok(result)
			},
			{ body: dto.RoleCreateDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.put(
			'/update',
			async function update({ body, auth }) {
				const result = await service.handleUpdate(body, auth.userId)
				return res.ok(result)
			},
			{ body: dto.RoleUpdateDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
		.delete(
			'/remove',
			async function remove({ body }) {
				const result = await service.handleRemove(body.id)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
