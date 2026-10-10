import { zRes } from '@ikki/contract/http'

import { endpoint } from '@/config/endpoint.ts'

import { createResourceKeys, defineMutation, defineQuery } from '@/lib/api/index.ts'

import { LoginDto, LoginResponseDto, MeResponseDto } from './dto/index.ts'

const keys = createResourceKeys('auth', 'me')

// ─── Query: /auth/me ───
export const authMeQuery = defineQuery({
	method: 'get',
	url: endpoint.auth.me,
	result: zRes.ok(MeResponseDto),
	queryKey: () => keys.detail(),
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
	result: zRes.ok(LoginResponseDto),
	invalidates: [keys.root()],
})

// ─── Mutation: /auth/logout ───
export const authLogoutMutation = defineMutation({
	method: 'post',
	url: endpoint.auth.logout,
	result: zRes.noData,
	invalidates: [keys.root()],
})
