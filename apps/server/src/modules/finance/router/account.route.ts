import Elysia from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@/core/validation'

import * as dto from '../dto/account.dto'
import type { FinanceServiceModule } from '../service'

export function initAccountRoute(module: FinanceServiceModule) {
	const service = module.account
	return new Elysia({ prefix: '/account' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.AccountFilterDto,
				response: createPaginatedResponseSchema(dto.AccountDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async function detail({ query }) {
				const result = await service.handleDetail(query.id)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(dto.AccountDto), auth: true },
		)
		.post(
			'/create',
			async function create({ body, auth }) {
				const result = await service.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: dto.AccountCreateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async function update({ body, auth }) {
				const { id, ...data } = body
				const result = await service.handleUpdate(id, { id, ...data }, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.AccountUpdateDto,
				response: createSuccessResponseSchema(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ query, auth }) {
				const result = await service.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
		)
}
