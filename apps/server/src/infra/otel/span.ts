import { record } from '@elysiajs/opentelemetry'

import type { Attributes, Span } from '@opentelemetry/api'

/**
 * Create a telemetry span. Wraps `record()` with consistent attribute wiring.
 *
 * @example
 * return withSpan('LocationService.handleCreate', async () => this.repo.insert(data))
 * return withSpan('CacheService.getOrSet', { 'cache.namespace': this.ns }, () => ...)
 */
export function withSpan<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T>
export function withSpan<T>(
	name: string,
	attributes: Attributes,
	fn: (span: Span) => Promise<T>,
): Promise<T>
export function withSpan<T>(
	name: string,
	attributesOrFn: Attributes | ((span: Span) => Promise<T>),
	maybeFn?: (span: Span) => Promise<T>,
): Promise<T> {
	const hasAttributes = typeof attributesOrFn !== 'function'
	const attributes = hasAttributes ? attributesOrFn : undefined
	const fn = hasAttributes ? maybeFn! : attributesOrFn

	return record(name, (span) => {
		if (attributes) span.setAttributes(attributes)
		return fn(span)
	})
}
