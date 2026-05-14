import type { PrimitiveId } from '@/types/utils'

import { AppError, type AppErrorOptions } from './app-error'

export abstract class HttpError extends AppError {
	protected constructor(
		public readonly statusCode: number,
		message: string,
		options?: AppErrorOptions,
	) {
		super(message, options)
	}
}

export class BadRequestError extends HttpError {
	constructor(message = 'Bad request', options?: AppErrorOptions) {
		super(400, message, {
			code: options?.code ?? 'BAD_REQUEST',
			meta: options?.meta,
			cause: options?.cause,
		})
	}
}

export class UnauthorizedError extends HttpError {
	constructor(message = 'Unauthorized', options?: AppErrorOptions) {
		super(401, message, {
			code: options?.code ?? 'UNAUTHORIZED',
			meta: options?.meta,
			cause: options?.cause,
		})
	}
}

export class ForbiddenError extends HttpError {
	constructor(message = 'Forbidden', options?: AppErrorOptions) {
		super(403, message, {
			code: options?.code ?? 'FORBIDDEN',
			meta: options?.meta,
			cause: options?.cause,
		})
	}
}

export class NotFoundError extends HttpError {
	constructor(message = 'Resource not found', options?: AppErrorOptions) {
		super(404, message, {
			code: options?.code ?? 'NOT_FOUND',
			meta: options?.meta,
			cause: options?.cause,
		})
	}

	static fromEntity(entity: string, id: PrimitiveId) {
		// oxlint-disable-next-line require-unicode-regexp
		const code = `${entity.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`
		return new NotFoundError(`Resource with ID ${id} not found`, {
			code,
			meta: { entity, id },
		})
	}
}

export class ConflictError extends HttpError {
	constructor(message = 'Conflict', options?: AppErrorOptions) {
		super(409, message, {
			code: options?.code ?? 'CONFLICT',
			meta: options?.meta,
			cause: options?.cause,
		})
	}
}

export class InternalServerError extends HttpError {
	constructor(message = 'Internal server error', options?: AppErrorOptions) {
		super(500, message, {
			code: options?.code ?? 'INTERNAL_SERVER_ERROR',
			meta: options?.meta,
			cause: options?.cause,
		})
	}
}
