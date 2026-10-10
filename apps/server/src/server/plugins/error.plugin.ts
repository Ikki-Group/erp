import { Elysia } from 'elysia'

import { getLogger } from '@/infra/logger/index.ts'
import { HttpError } from '@/shared/errors/http-error.ts'

const logger = getLogger(['server', 'error'])

export const errorPlugin = new Elysia({ name: 'error-plugin' })
	.onError((ctx) => {
		const { code, error, set, path } = ctx
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

			logger.warn('Validation failed', { path, issues, value: error.value })

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
					context: { path },
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
					path,
				})
			} else {
				logger.warn('Client error', {
					code: error.code,
					message: error.message,
					context: error.context,
					path,
				})
			}
			return {
				success: false,
				error: {
					path,
					code: error.code,
					message: error.message,
					...(error.context && { context: error.context }),
				},
			}
		}

		// A unique/one-active index rejected the write (e.g. a concurrent duplicate).
		const pg = postgresError(error)
		if (pg?.code === '23505') {
			set.status = 409
			logger.warn('Unique constraint violation', { path, constraint: pg.constraint })
			return {
				success: false,
				error: {
					path,
					code: 'CONFLICT',
					message: 'The record conflicts with an existing one',
					context: { constraint: pg.constraint },
				},
			}
		}

		// Unknown/unhandled error
		set.status = 500
		const message = error instanceof Error ? error.message : 'Unknown error'
		const stack = error instanceof Error ? error.stack : undefined
		logger.error('Unhandled error', { path, message, cause: pg?.message, stack })
		return {
			success: false,
			error: {
				path,
				code: 'INTERNAL_SERVER_ERROR',
				message: 'An unexpected error occurred',
			},
		}
	})
	.as('global')

interface PgErrorShape {
	code: string
	message: string
	constraint: string | undefined
}

/** Drizzle wraps driver errors; the Postgres error (with SQLSTATE `code`) is the cause. */
function postgresError(error: unknown): PgErrorShape | undefined {
	for (let e: unknown = error; e instanceof Error; e = e.cause) {
		if ('code' in e && typeof e.code === 'string' && /^[0-9A-Z]{5}$/u.test(e.code)) {
			const constraint =
				'constraint' in e && typeof e.constraint === 'string' ? e.constraint : undefined
			return { code: e.code, message: e.message, constraint }
		}
	}
	return undefined
}
