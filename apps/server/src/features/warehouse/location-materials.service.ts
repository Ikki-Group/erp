import { and, eq } from 'drizzle-orm'

import { locationMaterials, locations, materials } from '@/database/schema'
import { db } from '@/database'
import { NotFoundError } from '@/shared/errors/http.error'

import type { LocationMaterialsDto } from './location-material.dto'

export class LocationMaterialService {
  /**
   * Get all materials for a location
   */
  async getLocationMaterials(locationId: string) {
    // Verify location exists
    const [location] = await db.select().from(locations).where(eq(locations.id, locationId)).limit(1)
    if (!location) throw new NotFoundError('Location not found')

    const data = await db
      .select({
        locationMaterial: locationMaterials,
        material: materials,
      })
      .from(locationMaterials)
      .leftJoin(materials, eq(locationMaterials.materialId, materials.id))
      .where(and(eq(locationMaterials.locationId, locationId), eq(locationMaterials.isActive, true)))

    return data.map((row) => ({
      ...row.locationMaterial,
      material: row.material,
    }))
  }

  /**
   * Assign materials to a location (for stores)
   */
  async assignMaterialsToLocation(locationId: string, data: LocationMaterialsDto.AssignMaterials) {
    // Verify location exists
    const [location] = await db.select().from(locations).where(eq(locations.id, locationId)).limit(1)
    if (!location) throw new NotFoundError('Location not found')

    // Prepare assignments
    const assignments = data.materialIds.map((materialId) => ({
      locationId,
      materialId,
    }))

    // Insert with conflict handling (upsert)
    await db.insert(locationMaterials).values(assignments).onConflictDoNothing()

    return { assigned: data.materialIds.length }
  }

  /**
   * Unassign material from location
   */
  async unassignMaterialFromLocation(locationId: string, materialId: string) {
    const [locationMaterial] = await db
      .update(locationMaterials)
      .set({ isActive: false })
      .where(and(eq(locationMaterials.locationId, locationId), eq(locationMaterials.materialId, materialId)))
      .returning()

    if (!locationMaterial) throw new NotFoundError('Material not assigned to this location')
    return locationMaterial
  }
}

export const locationMaterialsService = new LocationMaterialService()
