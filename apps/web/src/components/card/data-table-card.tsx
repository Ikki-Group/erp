import { DataGrid } from '@/components/reui/data-grid/data-grid'
import { Table } from '@tanstack/react-table'
import {
  Card,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ReactNode } from 'react'
import { DataGridPagination } from '@/components/reui/data-grid/data-grid-pagination'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DataGridTable } from '@/components/reui/data-grid/data-grid-table'

interface DataTableCardProps<TData extends object> {
  table: Table<TData>
  isLoading?: boolean
  recordCount?: number
  action?: ReactNode
}

export function DataTableCard<TData extends object>({
  table,
  isLoading,
  action,
  recordCount = 0,
}: DataTableCardProps<TData>) {
  return (
    <DataGrid
      table={table}
      recordCount={recordCount}
      tableClassNames={{ edgeCell: 'px-5' }}
      isLoading={isLoading}
      loadingMode="spinner"
      tableLayout={{
        cellBorder: true,
      }}
    >
      <Card className="w-full gap-0! py-3.5" size="sm">
        <CardHeader className="flex items-center justify-between px-3.5 border-b">
          <CardTitle>Daftar Pengguna</CardTitle>
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
        <div className="w-full">
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        <CardFooter className="px-3.5 py-0 border-t">
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  )
}
