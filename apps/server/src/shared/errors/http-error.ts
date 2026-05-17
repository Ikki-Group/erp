import type { PrimitiveId } from '@/types/utils'

import { AppError, type AppErrorOptions } from './app-error'

interface HttpErrorOptions extends AppErrorOptions {
	code?: string
}

export abstract class HttpError extends AppError {
	protected constructor(
		/** HTTP status code */
		public readonly statusCode: number,
		message: string,
		options: HttpErrorOptions,
	) {
		super(message, options.code ?? 'HTTP_ERROR', {
			cause: options.cause,
			context: options.context,
		})
	}
}

export class BadRequestError extends HttpError {
	constructor(message = 'Bad request', options?: HttpErrorOptions) {
		super(400, message, {
			...options,
			code: options?.code ?? 'BAD_REQUEST',
		})
	}
}

export class UnauthorizedError extends HttpError {
	constructor(message = 'Unauthorized', options?: HttpErrorOptions) {
		super(401, message, {
			...options,
			code: options?.code ?? 'UNAUTHORIZED',
		})
	}
}

export class ForbiddenError extends HttpError {
	constructor(message = 'Forbidden', options?: HttpErrorOptions) {
		super(403, message, {
			...options,
			code: options?.code ?? 'FORBIDDEN',
		})
	}
}

export class NotFoundError extends HttpError {
	constructor(message = 'Resource not found', options?: HttpErrorOptions) {
		super(404, message, {
			...options,
			code: options?.code ?? 'NOT_FOUND',
		})
	}

	static fromEntity(entity: string, id: PrimitiveId) {
		// oxlint-disable-next-line require-unicode-regexp
		const code = `${entity.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`
		return new NotFoundError(`Resource with ID ${id} not found`, {
			code,
			context: { entity, id },
		})
	}
}

export class ConflictError extends HttpError {
	constructor(message = 'Conflict', options?: HttpErrorOptions) {
		super(409, message, {
			...options,
			code: options?.code ?? 'CONFLICT',
		})
	}
}

export class InternalServerError extends HttpError {
	constructor(message = 'Internal server error', options?: HttpErrorOptions) {
		super(500, message, {
			...options,
			code: options?.code ?? 'INTERNAL_SERVER_ERROR',
		})
	}
}
