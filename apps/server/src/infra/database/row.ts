import { NotFoundError } from '@/shared/errors/http-error'

/** First element or `undefined`. Standard Drizzle result extractor. */
export function takeFirst<T>(results: T[]): T | undefined {
	return results[0]
}

/** First element or throw NotFoundError. Use sparingly — NOT in repos. */
export function takeFirstOrThrow<T>(
	results: T[],
	message = 'Resource not found',
	code = 'NOT_FOUND',
): T {
	if (!results.length) throw new NotFoundError(message, { code })
	return results[0]!
}

/**
 * Assert a value is not `undefined`/`null`, otherwise throw the provided error.
 * Useful in service `handle*` methods to avoid repeated null-check boilerplate.
 *
 * @example
 * const user = assertFound(await this.getById(id), () => UserError.notFound(id))
 */
export function assertFound<T>(value: T | undefined | null, errorFactory: () => Error): T {
	if (value === undefined || value === null) throw errorFactory()
	return value
}
