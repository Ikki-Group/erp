import { useState } from "react";
import { DEFAULT_PAGINATION } from "./data-table-config";
import type { DataTableFilters, DataTablePagination, DataTableState } from "./data-table-types";

export function useDataTableState<
  F extends DataTableFilters = DataTableFilters,
>(): DataTableState<F> {
  const [pagination, setPagination] = useState<DataTablePagination>(DEFAULT_PAGINATION);

  const [search, setSearch] = useState<string>("");

  const [filters, setFilters] = useState<F>({} as F);

  return {
    pagination,
    setPagination,
    search,
    setSearch,
    filters,
    setFilters,
  };
}
