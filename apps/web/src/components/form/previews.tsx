import * as React from 'react'

import { DateRangePicker } from '@/components/ui/date-range-picker'

import type { ComponentRegistryEntry } from '../registry'
import type { DateRange } from 'react-day-picker'

export const formPreviews: Record<string, ComponentRegistryEntry['preview']> = {
	FormFieldComponent: () => {
		const [range, setRange] = React.useState<DateRange | undefined>()

		return (
			<div className="flex flex-col gap-4">
				<DateRangePicker
					value={range}
					onChange={setRange}
					className="w-[300px]"
					placeholder="Preview: Pilih Rentang Tanggal"
				/>
			</div>
		)
	},
}
