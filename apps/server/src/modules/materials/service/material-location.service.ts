import { record } from '@elysiajs/opentelemetry'
import type { PipelineStage } from 'mongoose'

import { PipelineBuilder, pipelineHelper, stampCreate, stampUpdate } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/error/http'
import { toLookupMap } from '@/lib/utils/collection.util'
import type { PaginationQuery, WithPaginationResult } from '@/lib/utils/pagination'

import type { LocationService } from '@/modules/location'

import { DB_NAME } from '@/config/db-name'

import {
  MaterialLocationDto,
  MaterialLocationStockDto,
  type MaterialLocationAssignDto,
  type MaterialLocationConfigDto,
  type MaterialLocationFilterDto,
  type MaterialLocationUnassignDto,
  type MaterialLocationWithLocationDto,
} from '../dto'
import { MaterialLocationModel } from '../model'

import type { MaterialService } from './material.service'

const err = {
  notFound: (id: ObjectId) =>
    new NotFoundError(`Material-Location assignment with ID ${id} not found`, 'MATERIAL_LOCATION_NOT_FOUND'),
  notAssigned: (materialId: ObjectId, locationId: ObjectId) =>
    new NotFoundError(
      `Material ${materialId} is not assigned to location ${locationId}`,
      'MATERIAL_NOT_ASSIGNED_TO_LOCATION'
    ),
  alreadyAssigned: (materialId: ObjectId, locationId: ObjectId) =>
    new ConflictError(
      `Material ${materialId} is already assigned to location ${locationId}`,
      'MATERIAL_LOCATION_ALREADY_ASSIGNED'
    ),
}

export class MaterialLocationService {
  constructor(
    private readonly materialSvc: MaterialService,
    private readonly locationSvc: LocationService
  ) {}

  /* ─────────────────────── INTERNAL QUERIES ─────────────────────── */

  /** Get a specific material-location assignment */
  async findOne(materialId: ObjectId, locationId: ObjectId): Promise<MaterialLocationDto> {
    return record('MaterialLocationService.findOne', async () => {
      const result = await PipelineBuilder.create(MaterialLocationModel)
        .push(pipelineHelper.$match({ materialId, locationId }), pipelineHelper.$setId())
        .execOne({ schema: MaterialLocationDto })

      if (!result) throw err.notAssigned(materialId, locationId)
      return result
    })
  }

  /** Get all assignments for a specific material */
  async findByMaterialId(materialId: ObjectId): Promise<MaterialLocationDto[]> {
    return record('MaterialLocationService.findByMaterialId', async () => {
      return PipelineBuilder.create(MaterialLocationModel)
        .push(pipelineHelper.$match({ materialId }), pipelineHelper.$setId())
        .exec({ schema: MaterialLocationDto.array() })
    })
  }

  /** Get all assignments for a specific location */
  async findByLocationId(locationId: ObjectId): Promise<MaterialLocationDto[]> {
    return record('MaterialLocationService.findByLocationId', async () => {
      return PipelineBuilder.create(MaterialLocationModel)
        .push(pipelineHelper.$match({ locationId }), pipelineHelper.$setId())
        .exec({ schema: MaterialLocationDto.array() })
    })
  }

  /* ──────────────────── HANDLER: ASSIGNMENTS ──────────────────── */

  /**
   * Assign multiple materials to a location (batch).
   * Skips any that are already assigned (upsert-like).
   */
  async handleAssign(data: MaterialLocationAssignDto, actorId: ObjectId): Promise<{ assignedCount: number }> {
    return record('MaterialLocationService.handleAssign', async () => {
      const { locationId, materialIds } = data

      // Validate location exists
      await this.locationSvc.findById(locationId)

      // Validate all materials exist
      for (const materialId of materialIds) {
        await this.materialSvc.findById(materialId)
      }

      // Find already assigned
      const existing = await MaterialLocationModel.find({
        locationId,
        materialId: { $in: materialIds },
      }).select('materialId')

      const existingMaterialIds = new Set(existing.map((e) => e.materialId.toString()))
      const newMaterialIds = materialIds.filter((mId) => !existingMaterialIds.has(mId.toString()))

      if (newMaterialIds.length === 0) return { assignedCount: 0 }

      const docs = newMaterialIds.map(
        (materialId) =>
          new MaterialLocationModel({
            materialId,
            locationId,
            ...stampCreate(actorId),
          })
      )

      await MaterialLocationModel.bulkSave(docs)

      // Sync locationIds on the Material documents
      for (const materialId of newMaterialIds) {
        await this.materialSvc.addLocationId(materialId, locationId)
      }

      return { assignedCount: newMaterialIds.length }
    })
  }

  /**
   * Unassign a material from a location.
   */
  async handleUnassign(data: MaterialLocationUnassignDto): Promise<{ id: ObjectId }> {
    return record('MaterialLocationService.handleUnassign', async () => {
      const { materialId, locationId } = data

      const result = await MaterialLocationModel.findOneAndDelete({ materialId, locationId })
      if (!result) throw err.notFound(materialId)

      // Remove locationId from the Material document
      await this.materialSvc.removeLocationId(materialId, locationId)

      return { id: result._id }
    })
  }

  /* ──────────────── HANDLER: LIST LOCATIONS PER MATERIAL ──────────────── */

  /**
   * List all locations assigned to a material, enriched with location details.
   */
  async handleLocationsByMaterial(materialId: ObjectId): Promise<MaterialLocationWithLocationDto[]> {
    return record('MaterialLocationService.handleLocationsByMaterial', async () => {
      // Validate material exists
      await this.materialSvc.findById(materialId)

      const assignments = await this.findByMaterialId(materialId)
      if (assignments.length === 0) return []

      const locations = await this.locationSvc.find()
      const locationMap = toLookupMap(locations, 'id')

      return assignments
        .map((a) => {
          const location = locationMap.get(a.locationId.toString())
          if (!location) return null
          return { ...a, location }
        })
        .filter(Boolean) as MaterialLocationWithLocationDto[]
    })
  }

  /* ──────────────── HANDLER: STOCK LIST PER LOCATION ──────────────── */

  /**
   * List materials at a specific location with stock data (paginated).
   * Uses $lookup to join material data.
   */
  async handleStockByLocation(
    filter: MaterialLocationFilterDto,
    pq: PaginationQuery
  ): Promise<WithPaginationResult<MaterialLocationStockDto>> {
    return record('MaterialLocationService.handleStockByLocation', async () => {
      const { locationId, search } = filter

      // Validate location exists
      await this.locationSvc.findById(locationId)

      // Build the aggregation pipeline
      const matchStage: PipelineStage.Match['$match'] = { locationId }

      const lookupMaterial = pipelineHelper.$lookup({
        from: DB_NAME.MATERIAL,
        localField: 'materialId',
        foreignField: '_id',
        as: 'material',
        let: { materialId: '$materialId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$materialId'] } } },
          { $project: { name: 1, sku: 1, baseUom: 1 } },
        ],
      })

      const pb = PipelineBuilder.create(MaterialLocationModel)
        .push(pipelineHelper.$match(matchStage))
        .push(lookupMaterial)
        .push(pipelineHelper.$unwind('$material'))

      // Apply search filter on material name/sku after lookup
      const pbWithSearch = search
        ? pb.push(
            pipelineHelper.$match({
              $or: [
                { 'material.name': { $regex: search, $options: 'i' } },
                { 'material.sku': { $regex: search, $options: 'i' } },
              ],
            })
          )
        : pb

      const StockProjection = {
        $set: {
          id: '$_id',
          materialName: '$material.name',
          materialSku: '$material.sku',
          baseUom: '$material.baseUom',
        },
      }

      const CleanupProjection: PipelineStage.FacetPipelineStage = {
        $project: {
          _id: 0,
          __v: 0,
          material: 0,
        },
      }

      return pbWithSearch.execPaginated({
        schema: MaterialLocationStockDto.array(),
        pq,
        facetAfter: [StockProjection, CleanupProjection],
      })
    })
  }

  /* ──────────────────── HANDLER: UPDATE CONFIG ──────────────────── */

  /**
   * Update per-location config (minStock, maxStock, reorderPoint).
   */
  async handleUpdateConfig(data: MaterialLocationConfigDto, actorId: ObjectId): Promise<{ id: ObjectId }> {
    return record('MaterialLocationService.handleUpdateConfig', async () => {
      const { id, ...update } = data

      const result = await MaterialLocationModel.findByIdAndUpdate(id, {
        ...update,
        ...stampUpdate(actorId),
      })

      if (!result) throw err.notFound(id)
      return { id }
    })
  }

  /* ──────────────── INVENTORY STOCK SYNC (called by inventory module) ──────────────── */

  /**
   * Update current stock snapshot. Called by the inventory module after recording a transaction.
   */
  async updateCurrentStock(
    materialId: ObjectId,
    locationId: ObjectId,
    stock: { currentQty: number; currentAvgCost: number; currentValue: number },
    actorId: ObjectId
  ): Promise<void> {
    return record('MaterialLocationService.updateCurrentStock', async () => {
      await MaterialLocationModel.findOneAndUpdate({ materialId, locationId }, { ...stock, ...stampUpdate(actorId) })
    })
  }
}
