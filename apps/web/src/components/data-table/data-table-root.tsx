import { createContext, PropsWithChildren, useContext } from 'react'

import { cn } from '@/lib/utils'

import { UseDataTableReturn } from './data-table-types'

const DataTableContext = createContext<UseDataTableReturn | null>(null)

export function DataTableRoot({
  table,
  children,
}: PropsWithChildren<{ table: UseDataTableReturn }>) {
  return (
    <DataTableContext.Provider value={table}>
      <div data-slot="data-table" className={cn('grid w-full')}>
        <div className={'flex flex-col overflow-auto'}>{children}</div>
      </div>
    </DataTableContext.Provider>
  )
}

export function useDataTableContext() {
  const context = useContext(DataTableContext)

  if (!context) {
    throw new Error('useDataTableContext must be used within a DataTableRoot')
  }

  return context
}
