import { record } from '@elysiajs/opentelemetry'

import { MaterialLocationModel } from '@/modules/materials/model'

import type { MaterialLocationAssignmentDto } from '../dto'

import type { MaterialService } from './material.service'

export class MaterialLocationService {
  constructor(public readonly materialSvc: MaterialService) {}

  /**
   * Upserts a list of MaterialLocationAssignmentDtos.
   */
  async handleAssign(assigns: MaterialLocationAssignmentDto[], userId: ObjectId): Promise<void> {
    return record('MaterialLocationService.handleAssign', async () => {
      const now = new Date()

      const assignsModel = assigns.map(
        (a) =>
          new MaterialLocationModel({
            ...a,
            assignedAt: now,
            assignedBy: userId,
          })
      )

      await MaterialLocationModel.bulkSave(assignsModel)
      return
    })
  }
}
