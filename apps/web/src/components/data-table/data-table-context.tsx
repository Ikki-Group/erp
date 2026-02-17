import { createContext, useContext } from 'react'
import { UseDataTableReturn } from './data-table-types'

export const DataTableContext = createContext<UseDataTableReturn<any> | null>(
  null,
)

export function useDataTableContext() {
  const context = useContext(DataTableContext)

  if (!context) {
    throw new Error('useDataTableContext must be used within a DataTableRoot')
  }

  return context
}
