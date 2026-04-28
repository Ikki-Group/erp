import { zp, zc, zq } from '@/lib/validation'

export const SupplierDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	email: zp.strNullable,
	phone: zp.strNullable,
	address: zp.strNullable,
	taxId: zp.strNullable,
	...zc.AuditFull.shape,
})
export type SupplierDto = z.infer<typeof SupplierDto>

export const SupplierCreateDto = z.object({
	code: zp.str,
	name: zp.str,
	email: zp.str.optional().nullable(),
	phone: zp.str.optional().nullable(),
	address: zp.str.optional().nullable(),
	taxId: zp.str.optional().nullable(),
})
export type SupplierCreateDto = z.infer<typeof SupplierCreateDto>

export const SupplierUpdateDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	email: zp.str.optional().nullable(),
	phone: zp.str.optional().nullable(),
	address: zp.str.optional().nullable(),
	taxId: zp.str.optional().nullable(),
})
export type SupplierUpdateDto = z.infer<typeof SupplierUpdateDto>

export const SupplierFilterDto = z.object({ ...zq.pagination.shape, q: zq.search })
export type SupplierFilterDto = z.infer<typeof SupplierFilterDto>
