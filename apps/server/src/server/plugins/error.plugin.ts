import { Elysia } from 'elysia'

import { getLogger } from '@/infra/logger/index.ts'
import { HttpError } from '@/shared/errors/http-error.ts'

const logger = getLogger(['server', 'error'])

export function errorPlugin() {
	return new Elysia({ name: 'error-plugin' })
		.onError(({ code, error, set }) => {
			// Elysia validation error (body/query/params schema failed)
			if (code === 'VALIDATION') {
				set.status = 422
				const validationError = error
				const issues =
					'all' in validationError && Array.isArray(validationError.all)
						? validationError.all.map((e: { path: string; summary?: string }) => ({
								path: e.path,
								message: e.summary ?? 'Validation error',
							}))
						: []

				logger.warn('Validation failed', { issues, error })

				return {
					success: false,
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Request validation failed',
						context: { issues, value: error.value },
					},
				}
			}

			// Elysia route not found (no matching handler)
			if (code === 'NOT_FOUND') {
				set.status = 404
				return {
					success: false,
					error: {
						code: 'ROUTE_NOT_FOUND',
						message: 'The requested endpoint does not exist',
					},
				}
			}

			// Our custom HttpError (BadRequest, NotFound, Conflict, etc.)
			if (error instanceof HttpError) {
				set.status = error.statusCode
				if (error.statusCode >= 500) {
					logger.error('Server error', {
						code: error.code,
						message: error.message,
						context: error.context,
					})
				} else {
					logger.warn('Client error', {
						code: error.code,
						message: error.message,
						context: error.context,
					})
				}
				return {
					success: false,
					error: {
						code: error.code,
						message: error.message,
						...(error.context && { context: error.context }),
					},
				}
			}

			// Unknown/unhandled error
			set.status = 500
			const message = error instanceof Error ? error.message : 'Unknown error'
			const stack = error instanceof Error ? error.stack : undefined
			logger.error('Unhandled error', { message, stack })
			return {
				success: false,
				error: {
					code: 'INTERNAL_SERVER_ERROR',
					message: 'An unexpected error occurred',
				},
			}
		})
		.as('global')
}
