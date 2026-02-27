

import { DataTableContext } from "./data-table-context";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableTable } from "./data-table-table";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableColumnHeader } from "./data-table-column-header";
import type { UseDataTableReturn } from "./data-table-types";
import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type DataTableProps = PropsWithChildren<{ table: UseDataTableReturn<any> }>;

function DataTable({ table, children }: DataTableProps) {
  return (
    <DataTableContext value={table}>
      <div data-slot="data-table" className={cn("grid w-full")}>
        <div className="flex flex-col overflow-auto gap-2">{children}</div>
      </div>
    </DataTableContext>
  );
}

DataTable.Table = DataTableTable;
DataTable.Pagination = DataTablePagination;
DataTable.Toolbar = DataTableToolbar;
DataTable.ColumnHeader = DataTableColumnHeader;

export { DataTable, DataTableColumnHeader, DataTableToolbar };
