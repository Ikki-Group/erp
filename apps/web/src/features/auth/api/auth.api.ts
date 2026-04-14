import { endpoint } from '@/config/endpoint'

import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@/lib/zod'

import { UserSelectDto } from '@/features/iam'

import { AuthSelectDto, LoginDto } from '../dto'

export const authApi = {
	login: apiFactory({
		method: 'post',
		url: endpoint.auth.login,
		body: LoginDto,
		result: createSuccessResponseSchema(AuthSelectDto),
	}),
	me: apiFactory({
		method: 'get',
		url: endpoint.auth.me,
		result: createSuccessResponseSchema(UserSelectDto),
	}),
}
