/**
 * Material module error factories
 *
 * Centralized error definitions for ALL sub-features.
 * Pattern: namespace.errorName(dynamicArg)
 */

import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
} from '@/shared/errors/http-error'

import { ERROR_CODES } from './material.constants'

/* ------------------------------- MASTER ERRORS ------------------------------ */

export const MasterErrors = {
	notFound: (id: number) =>
		new NotFoundError(`Material with ID ${id} not found`, { code: ERROR_CODES.MATERIAL_NOT_FOUND }),

	createFailed: () =>
		new InternalServerError('Material creation failed', { code: ERROR_CODES.MATERIAL_CREATE_FAILED }),

	skuAlreadyExists: (sku: string) =>
		new ConflictError(
			`Material SKU "${sku}" already exists`,
			{ code: ERROR_CODES.MATERIAL_SKU_ALREADY_EXISTS },
		),

	nameAlreadyExists: (name: string) =>
		new ConflictError(
			`Material name "${name}" already exists`,
			{ code: ERROR_CODES.MATERIAL_NAME_ALREADY_EXISTS },
		),
} as const

/* ------------------------------ CATEGORY ERRORS ----------------------------- */

export const CategoryErrors = {
	notFound: (id: number) =>
		new NotFoundError(
			`Material category with ID ${id} not found`,
			{ code: ERROR_CODES.MATERIAL_CATEGORY_NOT_FOUND },
		),

	createFailed: () =>
		new InternalServerError(
			'Material category creation failed',
			{ code: ERROR_CODES.MATERIAL_CATEGORY_CREATE_FAILED },
		),

	nameAlreadyExists: (name: string) =>
		new ConflictError(
			`Material category name "${name}" already exists`,
			{ code: ERROR_CODES.MATERIAL_CATEGORY_NAME_ALREADY_EXISTS },
		),
} as const

/* -------------------------------- UOM ERRORS -------------------------------- */

export const UomErrors = {
	notFound: (id: number) =>
		new NotFoundError(`UOM with ID ${id} not found`, { code: ERROR_CODES.UOM_NOT_FOUND }),

	notFoundByCode: (code: string) =>
		new NotFoundError(`UOM with code "${code}" not found`, { code: ERROR_CODES.UOM_NOT_FOUND }),

	createFailed: () => new InternalServerError('UOM creation failed', { code: ERROR_CODES.UOM_CREATE_FAILED }),

	codeAlreadyExists: (code: string) =>
		new ConflictError(`UOM code "${code}" already exists`, { code: ERROR_CODES.UOM_CODE_ALREADY_EXISTS }),
} as const

/* ------------------------------ LOCATION ERRORS ----------------------------- */

export const LocationErrors = {
	notFound: (id: number) =>
		new NotFoundError(
			`Material-Location assignment with ID ${id} not found`,
			{ code: ERROR_CODES.MATERIAL_LOCATION_NOT_FOUND },
		),

	notAssigned: (materialId: number, locationId: number) =>
		new NotFoundError(
			`Material ${materialId} is not assigned to location ${locationId}`,
			{ code: ERROR_CODES.MATERIAL_NOT_ASSIGNED_TO_LOCATION },
		),

	alreadyAssigned: (materialId: number, locationId: number) =>
		new ConflictError(
			`Material ${materialId} is already assigned to location ${locationId}`,
			{ code: ERROR_CODES.MATERIAL_LOCATION_ALREADY_ASSIGNED },
		),

	assignFailed: () =>
		new InternalServerError(
			'Failed to assign material to location',
			{ code: ERROR_CODES.MATERIAL_LOCATION_ASSIGN_FAILED },
		),
} as const

/* ----------------------------- CONVERSION ERRORS ---------------------------- */

export const ConversionErrors = {
	notFound: (id: number) =>
		new NotFoundError(
			`Material conversion with ID ${id} not found`,
			{ code: ERROR_CODES.MATERIAL_CONVERSION_NOT_FOUND },
		),

	createFailed: () =>
		new InternalServerError(
			'Material conversion creation failed',
			{ code: ERROR_CODES.MATERIAL_CONVERSION_CREATE_FAILED },
		),

	invalidFactor: (factor: string) =>
		new BadRequestError(
			`Invalid conversion factor: ${factor}. Must be a positive number.`,
			{ code: ERROR_CODES.MATERIAL_CONVERSION_INVALID_FACTOR },
		),

	uomAlreadyExists: () =>
		new ConflictError(
			'Material conversion for this UOM already exists',
			{ code: ERROR_CODES.MATERIAL_CONVERSION_UOM_ALREADY_EXISTS },
		),
} as const

/* --------------------------- AGGREGATED EXPORTS ----------------------------- */

export const MaterialErrors = {
	master: MasterErrors,
	category: CategoryErrors,
	uom: UomErrors,
	location: LocationErrors,
	conversion: ConversionErrors,
} as const
