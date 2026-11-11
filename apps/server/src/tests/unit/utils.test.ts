import { assertFound, hashPassword, RelationMap, verifyPassword } from '@/shared/utils/index.ts'

import { describe, expect, test } from 'bun:test'

// ─── hashPassword + verifyPassword ───

describe('hashPassword / verifyPassword', () => {
	test('hash returns a bcrypt string', async () => {
		const hash = await hashPassword('test123')
		expect(hash).toStartWith('$2')
		expect(hash.length).toBeGreaterThan(50)
	})

	test('verify correct password returns true', async () => {
		const hash = await hashPassword('mypassword')
		const result = await verifyPassword('mypassword', hash)
		expect(result).toBe(true)
	})

	test('verify wrong password returns false', async () => {
		const hash = await hashPassword('mypassword')
		const result = await verifyPassword('wrongpassword', hash)
		expect(result).toBe(false)
	})

	test('different passwords produce different hashes', async () => {
		const hash1 = await hashPassword('password1')
		const hash2 = await hashPassword('password2')
		expect(hash1).not.toBe(hash2)
	})

	test('same password produces different hashes (salt)', async () => {
		const hash1 = await hashPassword('same')
		const hash2 = await hashPassword('same')
		expect(hash1).not.toBe(hash2)
	})
})

// ─── RelationMap ───

describe('RelationMap', () => {
	const items = [
		{ id: 1, name: 'Alice' },
		{ id: 2, name: 'Bob' },
		{ id: 3, name: 'Charlie' },
	]

	test('fromArray creates a map keyed by keyFn', () => {
		const map = RelationMap.fromArray(items, (i) => i.id)
		expect(map.get(1)).toEqual({ id: 1, name: 'Alice' })
		expect(map.get(2)).toEqual({ id: 2, name: 'Bob' })
	})

	test('get returns undefined for missing key', () => {
		const map = RelationMap.fromArray(items, (i) => i.id)
		expect(map.get(999)).toBeUndefined()
	})

	test('has returns true for existing key', () => {
		const map = RelationMap.fromArray(items, (i) => i.id)
		expect(map.has(1)).toBe(true)
		expect(map.has(999)).toBe(false)
	})

	test('values returns all items', () => {
		const map = RelationMap.fromArray(items, (i) => i.id)
		expect(map.values()).toHaveLength(3)
	})

	test('works with string keys', () => {
		const map = RelationMap.fromArray(items, (i) => i.name)
		expect(map.get('Bob')).toEqual({ id: 2, name: 'Bob' })
	})

	test('empty array produces empty map', () => {
		const map = RelationMap.fromArray([], (i: { id: number }) => i.id)
		expect(map.values()).toHaveLength(0)
		expect(map.has(1)).toBe(false)
	})
})

// ─── assertFound ───

describe('assertFound', () => {
	test('returns value when defined', () => {
		const result = assertFound('hello', () => new Error('not found'))
		expect(result).toBe('hello')
	})

	test('returns falsy values that are not undefined', () => {
		expect(assertFound(0, () => new Error('x'))).toBe(0)
		expect(assertFound('', () => new Error('x'))).toBe('')
		expect(assertFound(null, () => new Error('x'))).toBeNull()
		expect(assertFound(false, () => new Error('x'))).toBe(false)
	})

	test('throws when value is undefined', () => {
		expect(() => assertFound(undefined, () => new Error('Not found!'))).toThrow('Not found!')
	})

	test('throws the exact error from factory', () => {
		class CustomError extends Error {
			code = 'CUSTOM'
		}
		expect(() => assertFound(undefined, () => new CustomError('oops'))).toThrow(CustomError)
	})
})
