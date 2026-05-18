import { createSuccessResponseSchema } from '@ikki/api-contract/validation'
import { Elysia } from 'elysia'

import { res } from '@/core/http/response'

import { authPluginMacro } from '@/server/plugins/auth.plugin'

import { UserSchema } from '@/modules/iam'

import { AuthLoginSchema, AuthOutputSchema } from './auth.schema'
import type { AuthService } from './auth.service'

export function initAuthRoute(svc: AuthService) {
	return new Elysia()
		.use(authPluginMacro)
		.post(
			'/login',
			async function login({ body }) {
				const { user, token } = await svc.login(body)
				return res.ok({ token, user }, 'AUTH_LOGIN_SUCCESS')
			},
			{ body: AuthLoginSchema, response: createSuccessResponseSchema(AuthOutputSchema) },
		)
		.get(
			'/me',
			async function me({ auth }) {
				const userWithDetails = await svc.getById(auth.user!.id)
				return res.ok(userWithDetails, 'AUTH_ME_SUCCESS')
			},
			{ response: createSuccessResponseSchema(UserSchema), auth: true },
		)
}
