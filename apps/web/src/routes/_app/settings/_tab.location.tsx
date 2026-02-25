import { DataTableCard } from "@/components/card/data-table-card";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Button } from "@/components/ui/button";
import { locationApi, LocationDto } from "@/features/location";
import { useDataTable } from "@/hooks/use-data-table";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { toDateTimeStamp } from "@/lib/formatter";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";

export const Route = createFileRoute("/_app/settings/_tab/location")({
  component: RouteComponent,
});

function RouteComponent() {
  return <LocationsTable />;
}

const ch = createColumnHelper<LocationDto>();
const locationColumns = [
  ch.accessor("name", {
    header: ({ column }) => (
      <DataGridColumnHeader title="Nama Role" visibility={true} column={column} />
    ),
    cell: (info) => (
      <div className="flex gap-2 flex-col">
        <p>{info.row.original.name}</p>
        <p className="text-muted-foreground text-xs italic">({info.row.original.code})</p>
      </div>
    ),
    enableSorting: false,
    size: 200,
  }),
  ch.accessor("createdAt", {
    header: "Dibuat Pada",
    cell: (info) => <p className="text-nowrap">{toDateTimeStamp(info.row.original.createdAt)}</p>,
    enableSorting: false,
  }),
  ch.accessor("updatedAt", {
    header: "Diubah Pada",
    cell: (info) => <p className="text-nowrap">{toDateTimeStamp(info.row.original.createdAt)}</p>,
    enableSorting: false,
  }),
];

function LocationsTable() {
  const ds = useDataTableState();
  const { data, isLoading } = useQuery(
    locationApi.list.query({
      ...ds.pagination,
    }),
  );

  const table = useDataTable({
    columns: locationColumns,
    data: data?.data ?? [],
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.total ?? 0,
    ds,
  });

  return (
    <DataTableCard
      table={table}
      isLoading={isLoading}
      recordCount={data?.meta.total || 0}
      action={<Button size="sm">Tambah Lokasi</Button>}
    />
  );
}
