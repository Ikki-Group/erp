import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery } from '@/lib/api/index.ts'
import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zp,
} from '@/lib/validation/index.ts'

import {
	AssignmentCreateDto,
	AssignmentDto,
	AssignmentFilterDto,
	AssignmentRemoveDto,
	LocationStaffListItemDto,
	RoleCreateDto,
	RoleDto,
	RoleFilterDto,
	RoleUpdateDto,
	UserCreateDto,
	UserDetailDto,
	UserFilterDto,
	UserListItemDto,
	UserResetPasswordDto,
	UserUpdateDto,
} from './dto/index.ts'

// ─── Staff Readers (location-staff, by-location) ───
//
// Both readers show user/role/assignment facts, so every write below invalidates
// both families. `all()` is the bare-URL prefix, which also covers every
// location-scoped partition of `locationStaff`.

const staffUrls = endpoint.iam.user

const staffKeys = {
	locationStaffAll: () => [staffUrls.locationStaff] as const,
	byLocationAll: () => [staffUrls.byLocation] as const,
}

// ─── Role Resource ───
// Role names are also projected into loaded staff rows.
const roleKeys = createResourceKeys('iam', 'role')
const roleList = defineQuery({
	method: 'get',
	url: endpoint.iam.role.list,
	query: RoleFilterDto,
	result: createPaginatedResponseSchema(RoleDto),
	queryKey: (query) => roleKeys.list(query),
})
const roleDetail = defineQuery({
	method: 'get',
	url: endpoint.iam.role.detail,
	query: zc.RecordId,
	result: createSuccessResponseSchema(RoleDto),
	queryKey: (query) => roleKeys.detail(query),
})
const roleCreate = defineMutation({
	method: 'post',
	url: endpoint.iam.role.create,
	body: RoleCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [roleKeys.lists()],
})

const roleUpdate = defineMutation({
	method: 'put',
	url: endpoint.iam.role.update,
	body: RoleUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [
		roleKeys.lists(),
		(args) => roleKeys.detail({ id: args.id }),
		staffKeys.locationStaffAll(),
		staffKeys.byLocationAll(),
	],
})

const roleRemove = defineMutation({
	method: 'delete',
	url: endpoint.iam.role.remove,
	query: zc.RecordId,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [roleKeys.lists(), staffKeys.locationStaffAll(), staffKeys.byLocationAll()],
})

export const roleResource = {
	keys: roleKeys,
	list: roleList,
	detail: roleDetail,
	create: roleCreate,
	update: roleUpdate,
	remove: roleRemove,
}

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

// Location-scoped: the server resolves the location from X-Location-ID, so the
// active location is part of the key and each location caches separately.
const locationStaffList = defineQuery({
	method: 'get',
	url: userUrls.locationStaff,
	query: UserFilterDto,
	result: createPaginatedResponseSchema(LocationStaffListItemDto),
	locationScoped: true,
})

// The location is an explicit query argument, so the default args key is enough.
const usersByLocation = defineQuery({
	method: 'get',
	url: userUrls.byLocation,
	query: UserFilterDto.extend({ locationId: zp.id }),
	result: createPaginatedResponseSchema(LocationStaffListItemDto),
})

const staffInvalidates = [staffKeys.locationStaffAll(), staffKeys.byLocationAll()] as const

const userCreate = defineMutation({
	method: 'post',
	url: userUrls.create,
	body: UserCreateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [userKeys.lists(), ...staffInvalidates],
})

const userUpdate = defineMutation({
	method: 'put',
	url: userUrls.update,
	body: UserUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [userKeys.lists(), (args) => userKeys.detail({ id: args.id }), ...staffInvalidates],
})

const userDeactivate = defineMutation({
	method: 'delete',
	url: userUrls.deactivate,
	query: zc.RecordId,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [userKeys.lists(), userKeys.details(), ...staffInvalidates],
})

const userResetPassword = defineMutation({
	method: 'put',
	url: userUrls.resetPassword,
	body: UserResetPasswordDto,
	result: createSuccessResponseSchema(zc.RecordId),
})

export const userResource = {
	keys: userKeys,
	list: userList,
	detail: userDetail,
	locationStaff: locationStaffList,
	byLocation: usersByLocation,
	create: userCreate,
	update: userUpdate,
	deactivate: userDeactivate,
	resetPassword: userResetPassword,
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
	invalidates: [assignmentKeys.lists(), userKeys.lists(), userKeys.details(), ...staffInvalidates],
})

const assignmentRemove = defineMutation({
	method: 'delete',
	url: assignmentUrls.remove,
	body: AssignmentRemoveDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [assignmentKeys.lists(), userKeys.lists(), userKeys.details(), ...staffInvalidates],
})

export const assignmentResource = {
	keys: assignmentKeys,
	list: assignmentList,
	assign: assignmentAssign,
	remove: assignmentRemove,
}
