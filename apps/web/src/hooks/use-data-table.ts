import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import type {
  OnChangeFn,
  PaginationState,
  Table,
  TableOptions} from "@tanstack/react-table";
import type { DataTableState } from "./use-data-table-state";

type UseDataTableProps<TData> = Omit<TableOptions<TData>, "getCoreRowModel" | "onStateChange"> & {
  isLoading?: boolean;
  ds: DataTableState;
};

function useBaseDataTable<TData>({
  data,
  columns,
  isLoading = false,
  ds,
  state = {},
  ...props
}: UseDataTableProps<TData>): Table<TData> {
  const [columnOrder, setColumnOrder] = useState<Array<string>>(
    columns.map((column) => column.id as string),
  );

  const pagination: PaginationState = useMemo(() => {
    const { page, limit } = ds.pagination;
    return {
      pageIndex: page - 1,
      pageSize: limit,
    };
  }, [ds.pagination]);

  const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      ds.setPagination({
        page: next.pageIndex + 1,
        limit: next.pageSize,
      });
    },
    [ds.pagination, pagination],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      globalFilter: ds.search,
      columnOrder,
      ...state,
    },
    onGlobalFilterChange: ds.setSearch,
    onPaginationChange,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...props,
  });

  return table;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>): Table<TData> {
  return useBaseDataTable({
    ...props,
    manualPagination: true,
  });
}

export function useDataTableAuto<TData>(props: UseDataTableProps<TData>): Table<TData> {
  return useBaseDataTable({
    ...props,
    manualPagination: false,
  });
}
