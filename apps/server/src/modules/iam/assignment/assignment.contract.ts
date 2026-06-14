import { z } from 'zod'

import { zp } from '@/shared/schema'

/* --------------------------------- ENTITY --------------------------------- */

export const UserAssignmentDto = z.object({
	id: zp.id,
	userId: zp.id,
	roleId: zp.id,
	locationId: zp.id,
	addedAt: zp.date,
	addedBy: zp.id.nullable(),
})
export type UserAssignmentDto = z.infer<typeof UserAssignmentDto>
