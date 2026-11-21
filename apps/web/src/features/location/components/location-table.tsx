import { createEntityColumns, TextCell } from '@/components/data-table'

import { LOCATION_TYPE_OPTIONS } from '../dto/index.ts'
import type { LocationDto } from '../dto/index.ts'

const col = createEntityColumns<LocationDto>()

export const locationColumns = [
	col.code('code', { header: 'Kode', size: 120 }),
	col.text('name', { header: 'Nama', size: 200 }),
	col.text('type', {
		header: 'Tipe',
		size: 120,
		cell: ({ getValue }) => (
			<TextCell
				value={
					LOCATION_TYPE_OPTIONS.find((option) => option.value === getValue())?.label ?? getValue()
				}
			/>
		),
	}),
	col.text('address', { header: 'Alamat', size: 250, cellProps: { muted: true } }),
	col.text('phone', {
		header: 'Telepon',
		size: 150,
		cellProps: { truncate: false, muted: true },
	}),
	col.booleanStatus('isActive', { header: 'Status', size: 100 }),
]
