import { z } from 'zod'

import { endpoint } from '@/config/endpoint.ts'

import { defineMutation, defineQuery } from '@/lib/api/index.ts'
import { createSuccessResponseSchema } from '@/lib/validation/index.ts'

import { LoginDto, LoginResponseDto, MeResponseDto } from './dto/index.ts'

// ─── Query: /auth/me ───

export const authMeQuery = defineQuery({
	method: 'get',
	url: endpoint.auth.me,
	result: createSuccessResponseSchema(MeResponseDto),
	queryKey: () => [endpoint.auth.me],
	// `session` tier (not `standard`): a session can now be revoked out-of-band
	// (another device's /auth/sessions/revoke, or a future admin force-logout —
	// see ADR-0018 on the server), so this query's staleness window directly
	// bounds how long a revoked session still reads as valid client-side after
	// the next window-focus/reconnect. See .scratch/tanstack-router-auth-guard-research.md
	// for the full reasoning.
	tier: 'session',
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
