import { Elysia } from 'elysia'

import { authPluginMacro } from '@/server/plugins/auth.plugin'
import { UnauthorizedError } from '@/shared/errors/http-error'
import { res } from '@/shared/http/response'
import { createSuccessResponseDto } from '@/shared/schema'

import { UserDto } from '@/modules/iam'

import { AuthLoginDto, AuthOutputDto } from './auth.contract'
import type { AuthService } from './auth.service'

export function createAuthRoute(svc: AuthService) {
	return new Elysia({ prefix: '/auth' })
		.use(authPluginMacro)
		.post(
			'/login',
			async function login(context) {
				const { user, token } = await svc.handleLogin(context.body)
				return res.ok({ token, user }, 'AUTH_LOGIN_SUCCESS')
			},
			{ body: AuthLoginDto, response: createSuccessResponseDto(AuthOutputDto) },
		)
		.get(
			'/me',
			async function me(context) {
				const userWithDetails = await svc.handleGetById(context.auth.user!.id)
				if (!userWithDetails) {
					throw new UnauthorizedError('User not found', { code: 'AUTH_USER_NOT_FOUND' })
				}
				return res.ok(userWithDetails, 'AUTH_ME_SUCCESS')
			},
			{ response: createSuccessResponseDto(UserDto), auth: true },
		)
}
