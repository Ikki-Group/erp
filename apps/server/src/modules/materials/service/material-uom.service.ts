import { eq, type InferInsertModel } from 'drizzle-orm'

import { db, type DBTransaction } from '@/database'
import { materialUomTable } from '@/database/schema'

import type { MaterialUomUpsertDto } from '../dto'

export class MaterialUomService {
  async bulkUpsert(materialId: number, uoms: MaterialUomUpsertDto[], tx?: DBTransaction): Promise<void> {
    await (tx ?? db).delete(materialUomTable).where(eq(materialUomTable.materialId, materialId))

    const values: InferInsertModel<typeof materialUomTable>[] = uoms.map((u) => ({
      materialId: materialId,
      uomId: u.uomId,
      conversionFactor: u.conversionFactor,
    }))

    await (tx ?? db).insert(materialUomTable).values(values)
  }
}
