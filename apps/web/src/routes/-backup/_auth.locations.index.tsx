import { createFileRoute, Link } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, Plus, Trash2, Power } from "lucide-react";

import { DataTable } from "@/components/common/templates/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useLocations,
  useDeleteLocation,
  useToggleLocationActive,
} from "@/features/location/hooks/locations.hooks";
import { useConfirm } from "@/providers/ConfirmProvider";
import { useDataTable } from "@/hooks/use-data-table";
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  search: z.string().optional(),
  sort: z.string().optional(),
  filters: z.string().optional(),
});

export const Route = createFileRoute("/_auth/locations/")({
  component: LocationsPage,
  validateSearch: (search) => searchSchema.parse(search),
});

function LocationsPage() {
  const { tableState, onStateChange } = useDataTable({
    routeId: "/_auth/locations/",
  });

  // Derive search from tableState.columnFilters
  const search = tableState.columnFilters?.find((f) => f.id === "name")?.value as
    | string
    | undefined;

  const { data, isLoading } = useLocations({
    page: (tableState.pagination?.pageIndex ?? 0) + 1,
    limit: tableState.pagination?.pageSize ?? 10,
    search: search,
  });

  const deleteLocation = useDeleteLocation();
  const toggleActive = useToggleLocationActive();
  const confirm = useConfirm();

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8"
        >
          Location Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="capitalize">{row.getValue("type")?.toString().replace("_", " ")}</span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "outline" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const location = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(location.id.toString())}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/locations/upsert" search={{ id: location.id }}>
                  Edit Location
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => toggleActive.mutate(location.id)}
              >
                <Power className="h-4 w-4" />
                {location.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: "Delete Location?",
                    description: `Are you sure you want to delete ${location.name}? This action cannot be undone.`,
                    confirmText: "Delete",
                    variant: "destructive",
                    confirmationKeyword: location.code,
                  });

                  if (isConfirmed) {
                    deleteLocation.mutate(location.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Locations</h2>
          <p className="text-sm text-muted-foreground">
            Manage your store and warehouse locations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link to="/locations/upsert">
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        manualPagination
        manualFiltering
        manualSorting
        pageCount={data?.meta.totalPages ?? 0}
        rowCount={data?.meta.total ?? 0}
        state={tableState}
        onStateChange={onStateChange}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Filter locations..."
      />
    </div>
  );
}
