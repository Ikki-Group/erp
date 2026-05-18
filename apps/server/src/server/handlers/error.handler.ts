import Elysia from 'elysia'
import { treeifyError, ZodError } from 'zod'

import { env } from '@/config/env'
import { HttpError } from '@/shared/errors/http-error'

import { logger } from '@/infra/logger'

const isDev = env.NODE_ENV === 'development'

function buildErrorResponse(code: string, message: string, context?: unknown, stack?: string) {
	return {
		success: false,
		code,
		message,
		...(context !== undefined && { context }),
		...(isDev && stack && { stack }),
	}
}

export const errorHandler = new Elysia({ name: 'error-handler' })
	.onError(({ error, code, set, path }) => {
		if (error instanceof ZodError) {
			set.status = 422
			logger.warn('Validation error on {path}', { path, code })
			return buildErrorResponse(
				'VALIDATION_ERROR',
				'Validation failed',
				treeifyError(error),
				error.stack,
			)
		}

		if (code === 'VALIDATION') {
			set.status = 422
			return buildErrorResponse(
				'VALIDATION_ERROR',
				'Request validation failed',
				error instanceof ZodError ? treeifyError(error) : error.all,
				error.stack,
			)
		}

		if (code === 'NOT_FOUND') {
			set.status = 404
			return buildErrorResponse('NOT_FOUND', 'Route not found', { path })
		}

		if (code === 'PARSE') {
			set.status = 400
			logger.warn('Parse error on {path}', { path })
			return buildErrorResponse(
				'PARSE_ERROR',
				'Failed to parse request body',
				error instanceof ZodError ? treeifyError(error) : error.cause,
				error.stack,
			)
		}

		if (code === 'INVALID_COOKIE_SIGNATURE') {
			set.status = 401
			return buildErrorResponse('INVALID_COOKIE', 'Invalid cookie signature')
		}

		if (error instanceof HttpError) {
			set.status = error.statusCode
			logger.warn('HTTP error {code} on {path}', { code: error.code, path })
			return buildErrorResponse(error.code, error.message, error.context, error.stack)
		}

		set.status = 500
		logger.error('Unhandled error on {path}', { err: error, path })
		const msg = isDev && error instanceof Error ? error.message : 'Internal server error'
		const stack = error instanceof Error ? error.stack : undefined

		return buildErrorResponse('INTERNAL_SERVER_ERROR', msg, undefined, stack)
	})
	.as('global')
