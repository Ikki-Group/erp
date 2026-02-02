import { z } from 'zod'

import { errorResponse } from '../responses'

/**
 * Error Response Schema for OpenAPI
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    stack: z.string().optional(),
  }),
})

/**
 * Base HTTP Error class for consistent error handling
 */
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
    return errorResponse(this.code ?? this.name, this.message, this.details)
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST', details?: Record<string, unknown>) {
    super(400, message, code, details)
    this.name = 'BadRequestError'
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, message, code)
    this.name = 'UnauthorizedError'
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(403, message, code)
    this.name = 'ForbiddenError'
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends HttpError {
  constructor(message = 'Not Found', code = 'NOT_FOUND') {
    super(404, message, code)
    this.name = 'NotFoundError'
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends HttpError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(409, message, code)
    this.name = 'ConflictError'
  }
}

/**
 * 422 Unprocessable Entity
 */
export class ValidationError extends HttpError {
  constructor(message = 'Validation Error', details?: Record<string, unknown>) {
    super(422, message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends HttpError {
  constructor(message = 'Internal Server Error', code = 'INTERNAL_ERROR') {
    super(500, message, code)
    this.name = 'InternalServerError'
  }
}
