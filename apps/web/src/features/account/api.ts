import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery } from '@/lib/api/index.ts'
import { createSuccessResponseSchema, zc } from '@/lib/validation/index.ts'

import {
	PasswordChangeDto,
	PasswordChangeResultDto,
	ProfileUpdateDto,
	RevokeOthersResultDto,
	SessionDto,
	SessionIdQueryDto,
} from './dto/index.ts'

const sessionsKey = () => [endpoint.auth.sessions.list] as const

// A profile save changes the identity every screen reads from /auth/me.
export const profileUpdate = defineMutation({
	method: 'put',
	url: endpoint.auth.profile,
	body: ProfileUpdateDto,
	result: createSuccessResponseSchema(zc.RecordId),
	invalidates: [[endpoint.auth.me]],
})

// Revokes every other session server-side; the caller's own stays valid.
export const passwordChange = defineMutation({
	method: 'post',
	url: endpoint.auth.password,
	body: PasswordChangeDto,
	result: createSuccessResponseSchema(PasswordChangeResultDto),
	invalidates: [sessionsKey()],
})

export const sessionsList = defineQuery({
	method: 'get',
	url: endpoint.auth.sessions.list,
	result: createSuccessResponseSchema(z.array(SessionDto)),
	queryKey: () => [...sessionsKey()],
})

export const sessionRevoke = defineMutation({
	method: 'delete',
	url: endpoint.auth.sessions.revoke,
	query: SessionIdQueryDto,
	result: createSuccessResponseSchema(z.undefined()),
	invalidates: [sessionsKey()],
})

export const sessionsRevokeOthers = defineMutation({
	method: 'delete',
	url: endpoint.auth.sessions.revokeOthers,
	result: createSuccessResponseSchema(RevokeOthersResultDto),
	invalidates: [sessionsKey()],
})
