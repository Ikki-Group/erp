import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

function useDataTableStore() {
  return {
    filters: {
      pagination: {
        page: 1,
        limit: 10,
      },
      sorting: [],
      columnFilters: [],
      globalFilter: '',
    },
    setFilters: () => {},
  }
}

type UseDataTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  isLoading?: boolean
}

export function useDataTableAuto<TData>({
  data,
  columns,
  isLoading,
}: UseDataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
}
