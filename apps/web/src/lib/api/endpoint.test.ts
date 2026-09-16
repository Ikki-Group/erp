import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import { createSuccessResponseSchema } from '@/lib/validation/index.ts'

import { setActiveLocationAccessor } from './active-location.ts'
import { defineMutation, defineQuery } from './endpoint.ts'

/**
 * Type-level acceptance for the no-arg ergonomics: an endpoint with neither a
 * `query` nor a `body` schema must be callable with zero arguments — no
 * `undefined as never` cast. An endpoint with a schema still requires its arg.
 */
describe('endpoint no-arg ergonomics (type-level)', () => {
	const noArgQuery = defineQuery({
		method: 'get',
		url: 'auth/me',
		result: createSuccessResponseSchema(z.object({ id: z.number() })),
	})

	const noArgMutation = defineMutation({
		method: 'post',
		url: 'auth/logout',
		result: createSuccessResponseSchema(z.undefined()),
	})

	const withQuery = defineQuery({
		method: 'get',
		url: 'location/detail',
		query: z.object({ id: z.number() }),
		result: createSuccessResponseSchema(z.object({ id: z.number() })),
	})

	it('lets a no-arg query build its key / options / fetch with zero arguments', () => {
		// The point of the retype: these compile with no argument at all.
		expectTypeOf(noArgQuery.queryKey).toBeCallableWith()
		expectTypeOf(noArgQuery.queryOptions).toBeCallableWith()
		expectTypeOf(noArgQuery.fetch).toBeCallableWith()
	})

	it('lets a no-arg mutation fetch / build options with zero arguments', () => {
		expectTypeOf(noArgMutation.fetch).toBeCallableWith()
		expectTypeOf(noArgMutation.mutationOptions).toBeCallableWith()
	})

	it('still requires the arg for a schema-bearing endpoint', () => {
		expectTypeOf(withQuery.queryKey).parameter(0).toEqualTypeOf<{ id: number }>()
		// @ts-expect-error — the query arg is mandatory, calling with none is an error
		withQuery.queryKey()
	})
})

describe('locationScoped query key folding (runtime)', () => {
	afterEach(() => {
		setActiveLocationAccessor(() => null)
	})

	const scoped = defineQuery({
		method: 'get',
		url: 'inventory/stock/list',
		query: z.object({ materialId: z.number() }),
		result: createSuccessResponseSchema(z.array(z.object({ id: z.number() }))),
		locationScoped: true,
	})

	const unscoped = defineQuery({
		method: 'get',
		url: 'inventory/stock/list',
		query: z.object({ materialId: z.number() }),
		result: createSuccessResponseSchema(z.array(z.object({ id: z.number() }))),
	})

	it('folds the active locationId into the key', () => {
		setActiveLocationAccessor(() => 3)
		expect(scoped.queryKey({ materialId: 9 })).toEqual([
			'inventory/stock/list',
			{ loc: 3 },
			{ materialId: 9 },
		])
	})

	it('partitions the key per location — same params, different location, different key', () => {
		setActiveLocationAccessor(() => 1)
		const atLoc1 = scoped.queryKey({ materialId: 9 })
		setActiveLocationAccessor(() => 2)
		const atLoc2 = scoped.queryKey({ materialId: 9 })
		expect(atLoc1).not.toEqual(atLoc2)
	})

	it('does not fold location into an unscoped endpoint even when one is active', () => {
		setActiveLocationAccessor(() => 3)
		expect(unscoped.queryKey({ materialId: 9 })).toEqual([
			'inventory/stock/list',
			{ materialId: 9 },
		])
	})

	it('rejects locationScoped combined with a custom queryKey (silent-no-op footgun)', () => {
		expect(() =>
			defineQuery({
				method: 'get',
				url: 'inventory/stock/list',
				result: createSuccessResponseSchema(z.array(z.object({ id: z.number() }))),
				locationScoped: true,
				queryKey: () => ['custom'],
			}),
		).toThrow(/locationScoped/)
	})
})

describe('two-schema endpoint (query + body)', () => {
	const both = defineQuery({
		method: 'post',
		url: 'search/things',
		query: z.object({ page: z.number() }),
		body: z.object({ term: z.string() }),
		result: createSuccessResponseSchema(z.array(z.object({ id: z.number() }))),
	})

	it('takes a single wrapped { query, body } arg and keys off it', () => {
		expectTypeOf(both.queryKey).parameter(0).toEqualTypeOf<{
			query: { page: number }
			body: { term: string }
		}>()

		const key = both.queryKey({ query: { page: 1 }, body: { term: 'x' } })
		expect(key).toEqual(['search/things', { query: { page: 1 }, body: { term: 'x' } }])
	})
})
