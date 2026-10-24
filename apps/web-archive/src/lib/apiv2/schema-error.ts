import type { ZodError } from 'zod'

export type ValidationTarget = 'query' | 'body' | 'response'

/**
 * Thrown when a Zod schema fails to parse — either data we're about to send
 * (`query`/`body`) or data the server sent back (`response`). This is
 * intentionally NOT an `ApiError` subclass: it represents a client-side
 * contract mismatch (a bug in the schema or an unannounced API change), not
 * an HTTP-level failure. Keeping the two hierarchies separate lets consumers
 * write precise `catch` blocks:
 *
 * ```ts
 * try {
 *   await someEndpoint.fetch(args)
 * } catch (error) {
 *   if (error instanceof ApiError) toast.error(error.friendlyMessage)
 *   else if (error instanceof SchemaValidationError) reportBug(error)
 *   else throw error
 * }
 * ```
 */
export class SchemaValidationError extends Error {
	readonly target: ValidationTarget
	readonly url: string
	readonly issues: ZodError['issues']

	constructor(target: ValidationTarget, url: string, cause: ZodError) {
		super(
			`[apiv2] ${target} validation failed for "${url}": ${cause.issues[0]?.message ?? 'invalid data'}`,
			{
				cause,
			},
		)
		this.name = 'SchemaValidationError'
		this.target = target
		this.url = url
		this.issues = cause.issues

		Object.setPrototypeOf(this, SchemaValidationError.prototype)
	}
}

export function isSchemaValidationError(error: unknown): error is SchemaValidationError {
	return error instanceof SchemaValidationError
}
