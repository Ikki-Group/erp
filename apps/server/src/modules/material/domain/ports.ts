/**
 * Repository Port Interfaces
 *
 * Abstract contracts for data access. Services depend on these
 * interfaces — not on concrete repo implementations.
 * Enables testability and clear dependency direction.
 */

import type { WithPaginationResult } from '@/core/database/pagination'
import type { DbClient, DbTx } from '@/core/database'

import type { Material, MaterialType } from './material.entity'
import type { MaterialCategory } from './material-category.entity'
import type { Uom } from './uom.entity'
import type { MaterialConversion } from './material-conversion.entity'
import type { MaterialLocation } from './material-location.entity'

/* -------------------------------- MATERIAL -------------------------------- */

export interface IMaterialRepo {
	getList(): Promise<Material[]>
	getById(id: number): Promise<Material | undefined>
	getByIds(ids: number[]): Promise<Material[]>
	getListPaginated(filter: MaterialListFilter): Promise<WithPaginationResult<Material>>
	count(): Promise<number>
	create(data: MaterialInsertData): Promise<{ id: number }>
	update(id: number, data: MaterialUpdateData): Promise<{ id: number }>
	remove(id: number): Promise<number | undefined>
}

export interface MaterialListFilter {
	page: number
	limit: number
	search?: string | undefined
	type?: MaterialType | undefined
	categoryId?: number | undefined
	locationIds?: number[] | undefined
	excludeLocationIds?: number[] | undefined
}

export interface MaterialInsertData {
	name: string
	description?: string | null | undefined
	sku: string
	type: MaterialType
	categoryId?: number | null | undefined
	baseUomId: number
	createdBy: number
}

export interface MaterialUpdateData {
	name?: string | undefined
	description?: string | null | undefined
	sku?: string | undefined
	type?: MaterialType | undefined
	categoryId?: number | null | undefined
	baseUomId?: number | undefined
	updatedBy: number
}

/* ------------------------------ CATEGORY ---------------------------------- */

export interface IMaterialCategoryRepo {
	getList(): Promise<MaterialCategory[]>
	getById(id: number): Promise<MaterialCategory | undefined>
	getListPaginated(filter: CategoryFilter): Promise<WithPaginationResult<MaterialCategory>>
	count(): Promise<number>
	create(data: CategoryInsertData): Promise<{ id: number }>
	update(id: number, data: CategoryUpdateData): Promise<{ id: number }>
	remove(id: number): Promise<{ id: number } | undefined>
}

export interface CategoryFilter {
	page: number
	limit: number
	q?: string | undefined
	parentId?: number | undefined
}

export interface CategoryInsertData {
	name: string
	description?: string | null | undefined
	parentId?: number | null | undefined
	createdBy: number
}

export interface CategoryUpdateData {
	name?: string | undefined
	description?: string | null | undefined
	parentId?: number | null | undefined
	updatedBy: number
}

/* ---------------------------------- UOM ----------------------------------- */

export interface IUomRepo {
	getList(): Promise<Uom[]>
	getById(id: number): Promise<Uom | undefined>
	getListPaginated(filter: UomFilter): Promise<WithPaginationResult<Uom>>
	count(): Promise<number>
	create(data: { code: string; createdBy: number }): Promise<number | undefined>
	update(id: number, data: { code: string; updatedBy: number }): Promise<number | undefined>
	remove(id: number): Promise<number | undefined>
	seed(data: { code: string; createdBy: number }[]): Promise<void>
}

export interface UomFilter {
	page: number
	limit: number
	q?: string | undefined
}

/* ------------------------------- CONVERSION ------------------------------- */

export interface IMaterialConversionRepo {
	getList(materialId?: number): Promise<MaterialConversion[]>
	getById(id: number): Promise<MaterialConversion | undefined>
	getByMaterialAndUom(materialId: number, uomId: number): Promise<MaterialConversion | undefined>
	getListPaginated(filter: ConversionFilter): Promise<WithPaginationResult<MaterialConversion>>
	count(materialId?: number): Promise<number>
	create(data: ConversionInsertData, actorId: number): Promise<number | undefined>
	update(data: ConversionUpdateData, actorId: number): Promise<number | undefined>
	remove(id: number): Promise<number | undefined>
	batchCreate(
		materialId: number,
		conversions: { uomId: number; toBaseFactor: string }[],
		actorId: number,
		tx?: DbTx | DbClient,
	): Promise<void>
	batchReplace(
		materialId: number,
		conversions: { uomId: number; toBaseFactor: string }[],
		actorId: number,
		tx?: DbTx | DbClient,
	): Promise<void>
}

export interface ConversionFilter {
	page: number
	limit: number
	materialId?: number | undefined
	uomId?: number | undefined
}

export interface ConversionInsertData {
	materialId: number
	uomId: number
	toBaseFactor: string
}

export interface ConversionUpdateData {
	id: number
	materialId: number
	uomId: number
	toBaseFactor: string
}

/* ------------------------------- LOCATION --------------------------------- */

export interface IMaterialLocationRepo {
	getOne(materialId: number, locationId: number): Promise<MaterialLocation | null>
	getByMaterialId(materialId: number): Promise<MaterialLocation[]>
	getByLocationId(locationId: number): Promise<MaterialLocation[]>
	getLocationsByMaterial(materialId: number): Promise<MaterialLocationWithLocation[]>
	getStockByLocationPaginated(
		filter: LocationStockFilter,
	): Promise<WithPaginationResult<MaterialLocationStock>>
	batchAssign(materialIds: number[], locationIds: number[], actorId: number): Promise<number>
	unassign(materialId: number, locationId: number): Promise<number | undefined>
	updateConfig(
		id: number,
		data: { minStock?: number | undefined; maxStock?: number | null | undefined; reorderPoint?: number | undefined },
		actorId: number,
	): Promise<number | undefined>
	updateCurrentStock(
		materialId: number,
		locationId: number,
		stock: { currentQty: number; currentAvgCost: number; currentValue: number },
		actorId: number,
		tx?: DbTx | DbClient,
	): Promise<void>
}

export interface LocationStockFilter {
	page: number
	limit: number
	locationId: number
	q?: string | undefined
}

/** MaterialLocation enriched with location details (from join) */
export interface MaterialLocationWithLocation extends MaterialLocation {
	location: {
		id: number
		name: string
		[key: string]: unknown
	}
}

/** Stock view — used in "stock list per location" */
export interface MaterialLocationStock {
	id: number
	materialId: number
	locationId: number
	materialName: string
	materialSku: string
	baseUomId: number
	uom: Uom | null
	minStock: string
	maxStock: string | null
	reorderPoint: string
	currentQty: string
	currentAvgCost: string
	currentValue: string
}

/* ------------------------------- QUERY ------------------------------------ */

export interface IMaterialQueryRepo {
	getListPaginated(filter: MaterialListFilter): Promise<WithPaginationResult<Material>>
}
