import * as React from 'react'

import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { DateRange } from 'react-day-picker'
import type { ComponentRegistryEntry } from '../registry'

export const formPreviews: Record<string, ComponentRegistryEntry['preview']> = {
  FormFieldComponent: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
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
