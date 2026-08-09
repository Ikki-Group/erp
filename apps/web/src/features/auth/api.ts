import { endpoint } from '@/config/endpoint.ts'
import { defineMutation, defineQuery } from '@/lib/api/index.ts'
import { createSuccessResponseSchema } from '@/lib/validation/index.ts'
import { z } from 'zod'

import {
	LoginDto,
	LoginResponseDto,
	MeResponseDto,
	SwitchLocationDto,
	SwitchLocationResponseDto,
} from './dto/index.ts'

// ─── Query: /auth/me ───

export const authMeQuery = defineQuery({
	method: 'get',
	url: endpoint.auth.me,
	result: createSuccessResponseSchema(MeResponseDto),
	queryKey: () => [endpoint.auth.me],
})

// ─── Mutation: /auth/login ───

export const authLoginMutation = defineMutation({
	method: 'post',
	url: endpoint.auth.login,
	body: LoginDto,
	result: createSuccessResponseSchema(LoginResponseDto),
	invalidates: [[endpoint.auth.me]],
})

// ─── Mutation: /auth/logout ───

export const authLogoutMutation = defineMutation({
	method: 'post',
	url: endpoint.auth.logout,
	result: createSuccessResponseSchema(z.undefined()),
	invalidates: [[endpoint.auth.me]],
})

// ─── Mutation: /auth/switch-location ───

export const authSwitchLocationMutation = defineMutation({
	method: 'post',
	url: endpoint.auth.switchLocation,
	body: SwitchLocationDto,
	result: createSuccessResponseSchema(SwitchLocationResponseDto),
	invalidates: [[endpoint.auth.me]],
})
