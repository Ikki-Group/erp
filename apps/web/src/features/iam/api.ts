import { zRes } from '@ikki/contract/http'
import { EntityRefDto, zq } from '@ikki/contract/schema'

import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery, defineResource } from '@/lib/api/index.ts'

import {
	AssignmentCreateDto,
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

// ─── Role Resource ───
export const roleResource = defineResource({
	feature: 'iam',
	resource: 'role',
	urls: endpoint.iam.role,
	entitySchema: RoleDto,
	filter: RoleFilterDto,
	create: RoleCreateDto,
	update: RoleUpdateDto,
})

// ─── User Resource ───
const userUrls = endpoint.iam.user
const userKeys = createResourceKeys('iam', 'user')
// The server scopes location-staff to the caller's active location.
const locationStaffKeys = createResourceKeys('iam', 'location-staff', { locationScoped: true })

const userList = defineQuery({
	method: 'get',
	url: userUrls.list,
	query: UserFilterDto,
	result: zRes.paginated(UserListItemDto),
	queryKey: (query) => userKeys.list(query),
})

const userDetail = defineQuery({
	method: 'get',
	url: userUrls.detail,
	query: zq.recordId,
	result: zRes.ok(UserDetailDto),
	queryKey: (query) => userKeys.detail(query),
})

const locationStaffList = defineQuery({
	method: 'get',
	url: userUrls.locationStaff,
	query: UserFilterDto,
	result: zRes.paginated(LocationStaffListItemDto),
	queryKey: (query) => locationStaffKeys.list(query),
})

const usersByLocation = defineQuery({
	method: 'get',
	url: userUrls.byLocation,
	query: UserFilterDto.extend({ locationId: zq.id }),
	result: zRes.paginated(LocationStaffListItemDto),
	queryKey: (query) => userKeys.list({ byLocation: query }),
})

// Any user/assignment change can alter every user-derived list (incl. location staff).
const userInvalidates = [userKeys.root(), locationStaffKeys.root()]

const userCreate = defineMutation({
	method: 'post',
	url: userUrls.create,
	body: UserCreateDto,
	result: zRes.ok(EntityRefDto),
	invalidates: userInvalidates,
})

const userUpdate = defineMutation({
	method: 'put',
	url: userUrls.update,
	body: UserUpdateDto,
	result: zRes.ok(EntityRefDto),
	invalidates: userInvalidates,
})

const userDeactivate = defineMutation({
	method: 'delete',
	url: userUrls.deactivate,
	query: zq.recordId,
	result: zRes.ok(EntityRefDto),
	invalidates: userInvalidates,
})

const userResetPassword = defineMutation({
	method: 'put',
	url: userUrls.resetPassword,
	body: UserResetPasswordDto,
	result: zRes.ok(EntityRefDto),
})

export const userResource = {
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

const assignmentAssign = defineMutation({
	method: 'post',
	url: assignmentUrls.assign,
	body: AssignmentCreateDto,
	result: zRes.ok(EntityRefDto),
	invalidates: userInvalidates,
})

const assignmentRemove = defineMutation({
	method: 'delete',
	url: assignmentUrls.remove,
	body: AssignmentRemoveDto,
	result: zRes.ok(EntityRefDto),
	invalidates: userInvalidates,
})

export const assignmentResource = {
	assign: assignmentAssign,
	remove: assignmentRemove,
}
