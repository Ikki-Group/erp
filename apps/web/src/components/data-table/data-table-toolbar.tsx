import { Settings2Icon, XIcon } from "lucide-react";
import { useDataTableContext } from "./data-table-context";
import type { ComponentProps } from "react";
import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps extends ComponentProps<"div"> {
  searchPlaceholder?: string;
}

export function DataTableToolbar({
  searchPlaceholder = "Search...",
  className,
  children,
  ...props
}: DataTableToolbarProps) {
  const { table, ds } = useDataTableContext();

  return (
    <div className={cn("flex items-center justify-between", className)} {...props}>
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={searchPlaceholder}
          value={ds.search}
          onChange={(event) => ds.setSearch(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {ds.search.length > 0 && (
          <Button variant="ghost" onClick={() => ds.setSearch("")} className="h-8 px-2 lg:px-3">
            Reset
            <XIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
        {children}
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex" />}
      >
        <Settings2Icon className="mr-2 h-4 w-4" />
        View
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.columnDef.meta?.label || column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
