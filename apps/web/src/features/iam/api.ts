import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
} from '@/lib/validation/index.ts'

import {
	AssignmentCreateDto,
	AssignmentDto,
	AssignmentFilterDto,
	AssignmentRemoveDto,
	RoleCreateDto,
	RoleDto,
	RoleFilterDto,
	RoleUpdateDto,
	UserCreateDto,
	UserDetailDto,
	UserFilterDto,
	UserListItemDto,
	UserUpdateDto,
} from './dto/index.ts'

// ─── Role Resource ───

export const roleResource = defineResource({
	urls: endpoint.iam.role,
	entitySchema: RoleDto,
	filter: RoleFilterDto,
	create: RoleCreateDto,
	update: RoleUpdateDto,
})

// ─── User Resource ───

const userUrls = endpoint.iam.user

const userKeys = {
	lists: () => [userUrls.list] as const,
	list: (query?: unknown) => [userUrls.list, query ?? null] as const,
	details: () => [userUrls.detail] as const,
	detail: (query?: unknown) => [userUrls.detail, query ?? null] as const,
}

const userList = defineQuery({
	method: 'get',
	url: userUrls.list,
	query: UserFilterDto,
	result: createPaginatedResponseSchema(UserListItemDto),
	queryKey: (query) => [userUrls.list, query ?? null],
})

const userDetail = defineQuery({
	method: 'get',
	url: userUrls.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(UserDetailDto),
	queryKey: (query) => [userUrls.detail, query ?? null],
})

const userCreate = defineMutation({
	method: 'post',
	url: userUrls.create,
	body: UserCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [userKeys.lists()],
})

const userUpdate = defineMutation({
	method: 'put',
	url: userUrls.update,
	body: UserUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [userKeys.lists(), (args) => userKeys.detail({ id: (args as { id: number }).id })],
})

const userDeactivate = defineMutation({
	method: 'delete',
	url: userUrls.deactivate,
	query: zc.RecordId,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [userKeys.lists()],
})

export const userResource = {
	keys: userKeys,
	list: userList,
	detail: userDetail,
	create: userCreate,
	update: userUpdate,
	deactivate: userDeactivate,
}

// ─── Assignment ───

const assignmentUrls = endpoint.iam.assignment

const assignmentKeys = {
	lists: () => [assignmentUrls.list] as const,
	list: (query?: unknown) => [assignmentUrls.list, query ?? null] as const,
}

const assignmentList = defineQuery({
	method: 'get',
	url: assignmentUrls.list,
	query: AssignmentFilterDto,
	result: createPaginatedResponseSchema(AssignmentDto),
	queryKey: (query) => [assignmentUrls.list, query ?? null],
})

const assignmentAssign = defineMutation({
	method: 'post',
	url: assignmentUrls.assign,
	body: AssignmentCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [assignmentKeys.lists(), userKeys.lists(), userKeys.details()],
})

const assignmentRemove = defineMutation({
	method: 'delete',
	url: assignmentUrls.remove,
	body: AssignmentRemoveDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [assignmentKeys.lists(), userKeys.lists(), userKeys.details()],
})

export const assignmentResource = {
	keys: assignmentKeys,
	list: assignmentList,
	assign: assignmentAssign,
	remove: assignmentRemove,
}
