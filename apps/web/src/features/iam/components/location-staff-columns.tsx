import type { ColumnDef } from '@tanstack/react-table'

import { z } from 'zod'

import { createEntityColumns, listSearchSchema } from '@/components/data-table'
import type { DataGridFeatures } from '@/components/reui/data-grid/data-grid'

import type { LocationStaffListItemDto } from '@/features/iam/dto/index.ts'

/** The staff endpoints filter by q/isActive only and never sort, so sort is not part of the URL. */
export const locationStaffSearchSchema = listSearchSchema.omit({ sort: true }).extend({
	isActive: z.coerce.number().int().min(0).max(1).optional(),
})
export type LocationStaffSearch = z.infer<typeof locationStaffSearchSchema>

export const LOCATION_STAFF_STATUS_OPTIONS = [
	{ label: 'Active', value: '1' },
	{ label: 'Inactive', value: '0' },
] as const

export function parseLocationStaffStatus(value: string | undefined): 0 | 1 | undefined {
	return value === '1' ? 1 : value === '0' ? 0 : undefined
}

const col = createEntityColumns<LocationStaffListItemDto>()

export const locationStaffColumns = [
	col.text('name', { header: 'Name', size: 220, enableSorting: false }),
	col.code('username', { header: 'Username', size: 160, enableSorting: false }),
	col.text('email', { header: 'Email', size: 220, enableSorting: false }),
	col.text('roleName', { header: 'Role', size: 180, enableSorting: false }),
	col.booleanStatus('isActive', { header: 'Status', size: 100, enableSorting: false }),
] as ColumnDef<DataGridFeatures, LocationStaffListItemDto>[]
