export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'HttpError'
  }

  toJSON() {
    return {
      code: this.code ?? this.name,
      message: this.message ?? this.name,
      error: {
        details: this.details,
        stack: this.stack,
      },
    }
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(400, message, code, details)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(401, message, code, details)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(403, message, code, details)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(404, message, code, details)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(409, message, code, details)
    this.name = 'ConflictError'
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(429, message, code, details)
    this.name = 'TooManyRequestsError'
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(500, message, code, details)
    this.name = 'InternalServerError'
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string, code?: string, details?: Record<string, unknown>) {
    super(503, message, code, details)
    this.name = 'ServiceUnavailableError'
  }
}
