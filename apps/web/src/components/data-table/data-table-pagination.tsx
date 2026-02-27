import { ChevronLeftIcon, ChevronRightIcon, MinusIcon } from "lucide-react";

import { Skeleton } from "../ui/skeleton";
import { useDataTableContext } from "./data-table-context";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "./data-table-config";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DataTablePaginationProps extends ComponentProps<"div"> {
  pageSizeOptions?: Array<number>;
}

export function DataTablePagination({
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
  ...props
}: DataTablePaginationProps) {
  const { table, rowCount, pageIndex, pageSize, isLoading, pageCount } = useDataTableContext();

  const from = rowCount === 0 ? rowCount : pageIndex * pageSize + 1;
  const to = Math.min(rowCount, (pageIndex + 1) * pageSize);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between py-2.5 text-sm text-muted-foreground flex-col md:flex-row",
        className,
      )}
      {...props}
    >
      <div className="inline-flex items-center">
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="mr-2">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isLoading ? (
          <Skeleton className="h-4 w-full min-w-32" />
        ) : (
          <>
            <p>{from}</p>
            <MinusIcon className="text-muted-foreground" />
            <p>{`${to} of ${rowCount} result`}</p>
          </>
        )}
      </div>
      <div className="flex items-center gap-x-2">
        <div className="inline-flex items-center gap-x-1 px-3 py-1.25">
          {isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <p>
              {pageIndex + 1} of {Math.max(pageCount, 1)} pages
            </p>
          )}
        </div>
        <Button
          aria-label="Go to previous page"
          variant="outline"
          type="button"
          size="icon"
          className="size-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          type="button"
          aria-label="Go to next page"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
