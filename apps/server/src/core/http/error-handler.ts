import Elysia from 'elysia'
import { treeifyError, ZodError } from 'zod'

import { logger } from '@/core/logger'

import { HttpError } from './errors'
import { env } from '@/config/env'

const isDev = env.NODE_ENV === 'development'

function buildErrorResponse(code: string, message: string, details?: unknown, stack?: string) {
	return {
		success: false,
		code,
		message,
		...(details !== undefined && { details }),
		...(isDev && stack && { stack }),
	}
}

export const errorHandler = new Elysia({ name: 'error-handler' })
	.onError(({ error, code, set, path }) => {
		logger.error({ err: error, path, code }, 'Request error')
		if (error instanceof ZodError) {
			set.status = 422
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
			return buildErrorResponse(error.code, error.message, error.details, error.stack)
		}

		set.status = 500
		let msg = 'Unhandled error'
		let stack = ''

		if (error instanceof Error) {
			msg = error.message
			stack = error.stack ?? ''
		}

		return buildErrorResponse('INTERNAL_SERVER_ERROR', msg, {}, stack)
	})
	.as('global')
