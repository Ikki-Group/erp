import { defineRelations } from 'drizzle-orm'

import { roles, userAssignments, users, userSessions } from './iam'
import { locations } from './locations'
import { materialCategoryTable, materialTable, materialUomTable, uomTable } from './material'

export const relations = defineRelations(
  {
    users,
    userAssignments,
    userSessions,
    roles,

    //
    locations,

    //
    materialCategoryTable,
    materialTable,
    materialUomTable,
    uomTable,
  },
  (r) => ({
    materialTable: {
      category: r.one.materialCategoryTable({
        from: r.materialTable.categoryId,
        to: r.materialCategoryTable.id,
      }),
      conversions: r.many.materialUomTable({
        from: r.materialTable.id,
        to: r.materialUomTable.materialId,
      }),
    },
  })
)
