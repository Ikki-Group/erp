import type { UseDataTableReturn } from './data-table-types'

import { createContext, use } from 'react'

export const DataTableContext = createContext<UseDataTableReturn<any> | null>(null)

export function useDataTableContext() {
	const context = use(DataTableContext)

	if (!context) {
		throw new Error('useDataTableContext must be used within a DataTableRoot')
	}

	return context
}
