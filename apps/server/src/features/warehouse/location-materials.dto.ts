import { z } from 'zod'

import { zh } from '@/shared/zod'

export namespace LocationMaterialsDto {
  /**
   * ASSIGN MATERIALS TO LOCATION
   */
  export const AssignMaterials = z.object({
    materialIds: z.array(zh.uuid).min(1),
  })
  export type AssignMaterials = z.infer<typeof AssignMaterials>
}
