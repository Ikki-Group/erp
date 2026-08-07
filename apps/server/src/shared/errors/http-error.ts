export interface HttpErrorOptions {
	code: string
	context?: Record<string, unknown>
}

export class HttpError extends Error {
	readonly statusCode: number
	readonly code: string
	readonly context: Record<string, unknown> | undefined

	constructor(message: string, statusCode: number, options: HttpErrorOptions) {
		super(message)
		this.statusCode = statusCode
		this.code = options.code
		this.context = options.context
	}
}

export class BadRequestError extends HttpError {
	constructor(message: string, options: HttpErrorOptions) {
		super(message, 400, options)
	}
}

export class UnauthorizedError extends HttpError {
	constructor(message = 'Unauthorized', options: HttpErrorOptions = { code: 'UNAUTHORIZED' }) {
		super(message, 401, options)
	}
}

export class ForbiddenError extends HttpError {
	constructor(message = 'Forbidden', options: HttpErrorOptions = { code: 'FORBIDDEN' }) {
		super(message, 403, options)
	}
}

export class NotFoundError extends HttpError {
	constructor(message: string, options: HttpErrorOptions) {
		super(message, 404, options)
	}
}

export class ConflictError extends HttpError {
	constructor(message: string, options: HttpErrorOptions) {
		super(message, 409, options)
	}
}

export class InternalServerError extends HttpError {
	constructor(message: string, options: HttpErrorOptions = { code: 'INTERNAL_SERVER_ERROR' }) {
		super(message, 500, options)
	}
}
