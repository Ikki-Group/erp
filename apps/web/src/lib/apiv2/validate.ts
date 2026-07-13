import { treeifyError, type z, type ZodError, type ZodType } from 'zod'

import { SchemaValidationError, type ValidationTarget } from './schema-error'

/**
 * Dev-only, richly formatted console log for a schema mismatch. Mirrors the
 * legacy `logValidationError` pattern from `@/lib/api/api-factory.ts` so the
 * DX during development stays familiar, but is only ever invoked right
 * before throwing a `SchemaValidationError` (see `parseOrThrow` below).
 */
function logValidationError(target: ValidationTarget, url: string, data: unknown, error: ZodError): void {
	if (!import.meta.env.DEV) return

	console.group(`%c[apiv2] ${target} validation failed`, 'color: #ef4444; font-weight: bold', `→ ${url}`)
	console.error('%cFirst issue:', 'color: #f59e0b; font-weight: bold', error.issues[0])
	console.error('%cZod tree:', 'color: #f59e0b; font-weight: bold', treeifyError(error))
	console.error('%cRaw data:', 'color: #f59e0b; font-weight: bold', data)
	console.error('%cAll issues:', 'color: #f59e0b; font-weight: bold', error.issues)
	console.groupEnd()
}

/**
 * Parses `data` against `schema`, throwing a `SchemaValidationError` (with a
 * dev-only console diagnostic) on failure instead of a raw `ZodError`.
 * Used for all three validation points: outgoing `query`, outgoing `body`,
 * and incoming `response`.
 */
export function parseOrThrow<S extends ZodType>(
	schema: S,
	data: unknown,
	target: ValidationTarget,
	url: string,
): z.output<S> {
	const result = schema.safeParse(data)

	if (!result.success) {
		logValidationError(target, url, data, result.error)
		throw new SchemaValidationError(target, url, result.error)
	}

	return result.data
}
