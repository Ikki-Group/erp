import { zc } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'
import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'

import * as dto from './leave-request.contract'
import type { LeaveRequestService } from './leave-request.service'

export function initLeaveRequestRoute(service: LeaveRequestService) {
	return new Elysia({ prefix: '/leave-request' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list({ query }) {
				const result = await service.handleList(query)
				return res.paginated(result)
			},
			{
				query: dto.LeaveRequestFilterDto,
				response: createPaginatedResponseDto(dto.LeaveRequestSelectDto),
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
				query: zc.RecordId,
				response: createSuccessResponseDto(dto.LeaveRequestDto),
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
				body: dto.LeaveRequestCreateDto,
				response: createSuccessResponseDto(zc.RecordId),
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
				body: dto.LeaveRequestUpdateDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.delete(
			'/remove',
			async function remove({ body, auth }) {
				const result = await service.handleRemove(body.id, auth.userId)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/approve',
			async function approve({ body, auth }) {
				const result = await service.handleApprove(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.LeaveRequestApproveDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/reject',
			async function reject({ body, auth }) {
				const result = await service.handleReject(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.LeaveRequestRejectDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
		.post(
			'/cancel',
			async function cancel({ body, auth }) {
				const result = await service.handleCancel(body, auth.userId)
				return res.ok(result)
			},
			{
				body: dto.LeaveRequestCancelDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
