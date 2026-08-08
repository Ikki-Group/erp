import { z } from 'zod'

import { zc, zp } from '@/shared/schema/index.ts'

// ─── Response ───

export const MaterialLocationDto = z.object({
	id: zp.id,
	materialId: zp.id,
	locationId: zp.id,
	...zc.AuditBasic.shape,
})
export type MaterialLocationDto = z.infer<typeof MaterialLocationDto>

// ─── Assign / Unassign Input ───

export const MaterialAssignDto = z.object({
	materialId: zp.id,
	locationId: zp.id,
})
export type MaterialAssignDto = z.infer<typeof MaterialAssignDto>
