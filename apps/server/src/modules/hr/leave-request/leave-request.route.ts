import Elysia from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { res } from '@/shared/http/response'
import { zc } from '@/shared/schema'
import { createPaginatedResponseDto, createSuccessResponseDto } from '@/shared/schema/response'

import * as dto from './leave-request.contract'
import type { LeaveRequestService } from './leave-request.service'

export function initLeaveRequestRoute(service: LeaveRequestService) {
	return new Elysia({ prefix: '/leave-request' })
		.use(authPluginMacro)
		.get(
			'/list',
			async function list(context) {
				const result = await service.handleList(context.query)
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
			async function detail(context) {
				const result = await service.handleDetail(context.query.id)
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
			async function create(context) {
				const result = await service.handleCreate(context.body, context.auth.userId)
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
			async function update(context) {
				const result = await service.handleUpdate(context.body, context.auth.userId)
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
			async function remove(context) {
				const result = await service.handleRemove(context.body.id, context.auth.userId)
				return res.ok(result)
			},
			{ body: zc.RecordId, response: createSuccessResponseDto(zc.RecordId), auth: true },
		)
		.post(
			'/approve',
			async function approve(context) {
				const result = await service.handleApprove(context.body, context.auth.userId)
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
			async function reject(context) {
				const result = await service.handleReject(context.body, context.auth.userId)
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
			async function cancel(context) {
				const result = await service.handleCancel(context.body, context.auth.userId)
				return res.ok(result)
			},
			{
				body: dto.LeaveRequestCancelDto,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
