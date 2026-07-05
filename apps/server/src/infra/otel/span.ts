import { record } from '@elysiajs/opentelemetry'

import type { Attributes, Span } from '@opentelemetry/api'

/**
 * Thin wrapper around `@elysiajs/opentelemetry`'s `record()` that standardizes
 * how the codebase creates telemetry spans and attaches attributes.
 *
 * Prefer this over calling `record()` + `span.setAttribute()` by hand: it keeps
 * span naming/attribute wiring consistent (and DRY) across services, repos, and
 * infra helpers.
 *
 * The callback receives the active `Span` so callers can still add ad-hoc
 * attributes/events when needed.
 *
 * @example
 * // simplest form — just name + work
 * return withSpan('LocationService.handleCreate', async () => {
 *   return this.repo.insert(data)
 * })
 *
 * @example
 * // with static attributes
 * return withSpan('CacheService.getOrSet', { 'cache.namespace': this.ns }, async () => {
 *   return this.cache.getOrSet(...)
 * })
 *
 * @example
 * // reaching the span for dynamic attributes/events
 * return withSpan('db.paginate', async (span) => {
 *   span.setAttribute('page', pq.page)
 *   return runQuery()
 * })
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
