import { Elysia } from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'

import { UserDetailDto } from '@/modules/iam'

import { AuthOutputDto, LoginDto } from './login.dto'
import type { LoginService } from './login.service'
import { createSuccessResponseSchema } from '@/lib/validation'

export function initAuthRoute(svc: LoginService) {
	return new Elysia()
		.use(authPluginMacro)
		.post(
			'/login',
			async function login({ body }) {
				const { user, token } = await svc.login(body)
				return res.ok({ token, user }, 'AUTH_LOGIN_SUCCESS')
			},
			{ body: LoginDto, response: createSuccessResponseSchema(AuthOutputDto) },
		)
		.get(
			'/me',
			async function me({ auth }) {
				const userWithDetails = await svc.getById(auth.user!.id)
				return res.ok(userWithDetails, 'AUTH_ME_SUCCESS')
			},
			{ response: createSuccessResponseSchema(UserDetailDto), auth: true },
		)
}
