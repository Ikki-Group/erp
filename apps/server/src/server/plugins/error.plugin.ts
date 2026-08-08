import { Elysia } from 'elysia'

import { HttpError } from '@/shared/errors/http-error.ts'

export const errorPlugin = new Elysia({ name: 'error-plugin' }).onError(({ error, set }) => {
	if (error instanceof HttpError) {
		set.status = error.statusCode
		return {
			success: false,
			error: {
				code: error.code,
				message: error.message,
				context: error.context,
			},
		}
	}

	set.status = 500
	return {
		success: false,
		error: {
			code: 'INTERNAL_SERVER_ERROR',
			message: 'An unexpected error occurred',
		},
	}
})
