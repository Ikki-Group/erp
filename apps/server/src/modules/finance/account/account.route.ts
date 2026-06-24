import { zc, zq } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import { AccountDto, AccountCreateDto, AccountUpdateDto, AccountFilterDto } from './account.contract'
import type { AccountService } from './account.service'

export function initAccountRoute(s: AccountService) {
	return new Elysia({ prefix: '/account' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await s.handleList(query)
				return res.paginated(result)
			},
			{
				query: AccountFilterDto,
				response: createPaginatedResponseDto(AccountDto),
				auth: true,
			},
		)
		.get(
			'/detail',
			async ({ query }) => {
				const account = await s.handleDetail(query.id)
				return res.ok(account)
			},
			{ query: zq.recordId, response: createSuccessResponseDto(AccountDto), auth: true },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await s.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: AccountCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.patch(
			'/update',
			async ({ body, auth }) => {
				const result = await s.handleUpdate(body.id, body, auth.userId)
				return res.ok(result)
			},
			{
				body: AccountUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async ({ query, auth }) => {
				const result = await s.handleRemove(query.id, auth.userId)
				return res.ok(result)
			},
			{ query: zq.recordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
}
