export class HttpError extends Error {
	constructor(
		public readonly statusCode: number,
		message: string,
		public readonly code: string,
		public readonly details?: Record<string, unknown>,
	) {
		super(message)
		this.name = 'HttpError'

		// Preserves stack trace in V8
		Error.captureStackTrace(this, this.constructor)
	}
}

export class BadRequestError extends HttpError {
	constructor(message: string, code = 'BAD_REQUEST', details?: Record<string, unknown>) {
		super(400, message, code, details)
		this.name = 'BadRequestError'
	}
}

export class UnauthorizedError extends HttpError {
	constructor(message: string, code = 'UNAUTHORIZED', details?: Record<string, unknown>) {
		super(401, message, code, details)
		this.name = 'UnauthorizedError'
	}
}

export class ForbiddenError extends HttpError {
	constructor(message: string, code = 'FORBIDDEN', details?: Record<string, unknown>) {
		super(403, message, code, details)
		this.name = 'ForbiddenError'
	}
}

export class NotFoundError extends HttpError {
	constructor(message: string, code = 'NOT_FOUND', details?: Record<string, unknown>) {
		super(404, message, code, details)
		this.name = 'NotFoundError'
	}
}

export class ConflictError extends HttpError {
	constructor(message: string, code = 'CONFLICT', details?: Record<string, unknown>) {
		super(409, message, code, details)
		this.name = 'ConflictError'
	}
}

export class InternalServerError extends HttpError {
	constructor(message: string, code = 'INTERNAL_SERVER_ERROR', details?: Record<string, unknown>) {
		super(500, message, code, details)
		this.name = 'InternalServerError'
	}
}
