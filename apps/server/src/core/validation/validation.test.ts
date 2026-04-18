import { describe, it, expect } from 'bun:test'
import { z } from 'zod'
import { zp } from './primitive'
import { zq } from './query'
import { zc } from './common'
import { createSuccessResponseSchema, createPaginatedResponseSchema } from './response'

describe('Primitive Validators (zp)', () => {
	describe('zId', () => {
		it('accepts positive integers', () => {
			expect(zp.id.parse(1)).toBe(1)
			expect(zp.id.parse(999)).toBe(999)
		})

		it('rejects zero and negative numbers', () => {
			expect(() => zp.id.parse(0)).toThrow()
			expect(() => zp.id.parse(-1)).toThrow()
		})

		it('rejects floats', () => {
			expect(() => zp.id.parse(1.5)).toThrow()
		})
	})

	describe('date', () => {
		it('coerces string dates to Date objects', () => {
			const result = zp.date.parse('2024-01-01')
			expect(result).toBeInstanceOf(Date)
		})

		it('accepts Date objects', () => {
			const date = new Date()
			expect(zp.date.parse(date)).toEqual(date)
		})
	})

	describe('str and strNullable', () => {
		it('validates strings', () => {
			expect(zp.str.parse('hello')).toBe('hello')
		})

		it('handles nullable strings', () => {
			expect(zp.strNullable.parse('hello')).toBe('hello')
			expect(zp.strNullable.parse(null)).toBeNull()
		})
	})

	describe('bool and boolCoerce', () => {
		it('validates boolean values', () => {
			expect(zp.bool.parse(true)).toBe(true)
			expect(zp.bool.parse(false)).toBe(false)
		})

		it('coerces values to boolean', () => {
			expect(zp.boolCoerce.parse(1)).toBe(true)
			expect(zp.boolCoerce.parse(0)).toBe(false)
			expect(zp.boolCoerce.parse('true')).toBe(true)
		})
	})
})

describe('Query Validators (zq)', () => {
	describe('idDto', () => {
		it('coerces string IDs to numbers', () => {
			expect(zq.id.parse('123')).toBe(123)
		})

		it('rejects invalid IDs', () => {
			expect(() => zq.id.parse(0)).toThrow()
			expect(() => zq.id.parse('abc')).toThrow()
		})
	})

	describe('idsDto', () => {
		it('accepts single ID and converts to array', () => {
			const result = zq.ids.parse(1)
			expect(Array.isArray(result)).toBe(true)
			expect(result).toEqual([1])
		})

		it('accepts array of IDs', () => {
			const result = zq.ids.parse([1, 2, 3])
			expect(result).toEqual([1, 2, 3])
		})
	})

	describe('searchDto', () => {
		it('trims and filters empty searches', () => {
			expect(zq.search.parse('  hello  ')).toBe('hello')
			expect(zq.search.parse('   ')).toBeUndefined()
			expect(zq.search.parse(undefined)).toBeUndefined()
		})
	})

	describe('booleanDto', () => {
		it('parses string boolean values', () => {
			expect(zq.boolean.parse('true')).toBe(true)
			expect(zq.boolean.parse('false')).toBe(false)
			expect(zq.boolean.parse('1')).toBe(true)
			expect(zq.boolean.parse('0')).toBe(false)
		})

		it('handles undefined as optional', () => {
			expect(zq.boolean.parse(undefined)).toBeUndefined()
		})
	})

	describe('paginationDto', () => {
		it('uses sensible defaults', () => {
			const result = zq.pagination.parse({})
			expect(result.page).toBe(1)
			expect(result.limit).toBe(10)
		})

		it('catches invalid limit and returns default', () => {
			const result = zq.pagination.parse({ limit: 101 })
			expect(result.limit).toBe(10)
		})

		it('coerces string values', () => {
			const result = zq.pagination.parse({ page: '2', limit: '50' })
			expect(result.page).toBe(2)
			expect(result.limit).toBe(50)
		})

		it('catches invalid pagination and returns defaults', () => {
			const result = zq.pagination.parse({ page: 'invalid', limit: 'invalid' })
			expect(result.page).toBe(1)
			expect(result.limit).toBe(10)
		})
	})
})

describe('Common Validators (zc)', () => {
	describe('strTrimDto', () => {
		it('trims whitespace', () => {
			expect(zc.strTrim.parse('  hello  ')).toBe('hello')
		})
	})

	describe('strTrimNullableDto', () => {
		it('converts empty strings to null', () => {
			expect(zc.strTrimNullable.parse('   ')).toBeNull()
		})

		it('preserves non-empty strings', () => {
			expect(zc.strTrimNullable.parse('  hello  ')).toBe('hello')
		})
	})

	describe('emailDto', () => {
		it('validates email format', () => {
			expect(zc.email.parse('user@example.com')).toBe('user@example.com')
		})

		it('normalizes to lowercase', () => {
			expect(zc.email.parse('USER@EXAMPLE.COM')).toBe('user@example.com')
		})

		it('rejects invalid emails', () => {
			expect(() => zc.email.parse('invalid')).toThrow()
			expect(() => zc.email.parse('user@')).toThrow()
		})

		it('enforces max length', () => {
			const longEmail = 'a'.repeat(250) + '@example.com'
			expect(() => zc.email.parse(longEmail)).toThrow()
		})
	})

	describe('AuditMetaDto', () => {
		it('requires all audit fields', () => {
			const validMeta = {
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 1,
				updatedBy: 1,
			}
			expect(() => zc.AuditMeta.parse(validMeta)).not.toThrow()
		})
	})

	describe('PaginationMetaDto', () => {
		it('validates pagination metadata', () => {
			const meta = zc.PaginationMeta.parse({
				page: 1,
				limit: 10,
				total: 100,
				totalPages: 10,
			})
			expect(meta.page).toBe(1)
			expect(meta.totalPages).toBe(10)
		})
	})
})

describe('Response Schemas', () => {
	describe('createSuccessResponseSchema', () => {
		it('wraps data in standard envelope', () => {
			const itemSchema = z.object({ id: zp.id, name: zp.str })
			const responseSchema = createSuccessResponseSchema(itemSchema)

			const response = responseSchema.parse({
				success: true,
				code: 'OK',
				data: { id: 1, name: 'test' },
			})

			expect(response.success).toBe(true)
			expect(response.data.id).toBe(1)
		})
	})

	describe('createPaginatedResponseSchema', () => {
		it('includes pagination metadata', () => {
			const itemSchema = z.object({ id: zp.id })
			const responseSchema = createPaginatedResponseSchema(itemSchema)

			const response = responseSchema.parse({
				success: true,
				code: 'OK',
				data: [{ id: 1 }, { id: 2 }],
				meta: {
					page: 1,
					limit: 10,
					total: 2,
					totalPages: 1,
				},
			})

			expect(response.data).toHaveLength(2)
			expect(response.meta.total).toBe(2)
		})
	})
})
