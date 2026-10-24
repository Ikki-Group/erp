import { treeifyError } from 'zod'

import type { z, ZodError, ZodType } from 'zod'

export type ValidationTarget = 'Query' | 'Body' | 'Response'

/* ----------------------------------------------------------------
 * Dev-only validation logger
 * ----------------------------------------------------------------
 * Logs only on validation failures. Includes:
 *   - the validation target (Query / Body / Response)
 *   - the endpoint that triggered the error
 *   - zod treeifyError (human-readable schema diff)
 *   - the raw data that failed validation
 *   - error path to quickly locate the issue
 * Ported unchanged (in behavior) from the legacy `lib/api/api-factory.ts`.
 * ---------------------------------------------------------------*/
function logValidationError(
	target: ValidationTarget,
	url: string,
	error: ZodError,
	rawData: unknown,
) {
	if (!import.meta.env.DEV) return

	const label = `[apiv2] ${target} validation failed → ${url}`

	console.group(`%c✗ ${label}`, 'color:#f59e0b;font-weight:bold;font-size:14px')
	console.log(
		'%c📋 Error Path:',
		'color:#ef4444;font-weight:600',
		error.issues[0]?.path.join('.') ?? 'root',
	)
	console.log('%c❌ Error Message:', 'color:#ef4444;font-weight:600', error.issues[0]?.message)
	console.log('%c🌳 Zod Tree:', 'color:#ef4444;font-weight:600', treeifyError(error))
	console.log('%c📦 Raw Data:', 'color:#6b7280;font-weight:600', rawData)
	console.log('%c📝 All Issues:', 'color:#6b7280;font-weight:600', error.issues)
	console.trace('%c📍 Stack Trace:', 'color:#8b5cf6;font-weight:600')
	console.groupEnd()
}

/* ----------------------------------------------------------------
 * Validate a value against a Zod schema (safeParse + log on fail).
 * Returns parsed data or throws the ZodError.
 * ---------------------------------------------------------------*/
export function validateOrThrow<S extends ZodType>(
	schema: S,
	data: unknown,
	target: ValidationTarget,
	url: string,
): z.output<S> {
	const result = schema.safeParse(data)
	if (result.success) return result.data

	logValidationError(target, url, result.error, data)
	throw result.error
}
