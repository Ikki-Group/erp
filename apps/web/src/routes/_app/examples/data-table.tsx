import { createFileRoute } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableAuto, useDataTableState } from "@/components/data-table";
import { Page } from "@/components/layout/page";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_app/examples/data-table")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Page>
      <Page.Header>
        <Page.Title>Data Table Examples</Page.Title>
        <Page.Description>
          Comprehensive examples of data table features and use cases
        </Page.Description>
      </Page.Header>

      <Page.Content className="space-y-8">
        <AdvancedExample />
        <BasicExample />
      </Page.Content>
    </Page>
  );
}

// ============================================================================
// Types & Mock Data
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "User" | "Guest";
  status: "Active" | "Inactive" | "Pending";
  createdAt: Date;
}

const MOCK_USERS: Array<User> = Array.from({ length: 100 }).map((_, index) => ({
  id: `user-${index + 1}`,
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  role: (["Admin", "User", "Guest"] as const)[index % 3],
  status: (["Active", "Inactive", "Pending"] as const)[index % 3],
  createdAt: new Date(2024, 0, (index % 28) + 1),
}));

// ============================================================================
// Example 1: Basic Table
// ============================================================================

function BasicExample() {
  const ds = useDataTableState();
  const table = useDataTableAuto({
    data: MOCK_USERS,
    columns: basicColumns,
    ds,
    isLoading: true,
  });

  return (
    <Card>
      <Card.Header>
        <Card.Title>Basic Table</Card.Title>
        <Card.Description>Simple data table with pagination</Card.Description>
      </Card.Header>
      <DataTable table={table}>
        <DataTable.Table />
        <Card.Footer>
          <DataTable.Pagination />
        </Card.Footer>
      </DataTable>
    </Card>
  );
}

const ch = createColumnHelper<User>();

const basicColumns = [
  ch.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue(),
  }),
  ch.accessor("email", {
    header: "Email",
    cell: (info) => info.getValue(),
  }),
  ch.accessor("role", {
    header: "Role",
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
  }),
];

// ============================================================================
// Example 2: Advanced Table
// ============================================================================

function AdvancedExample() {
  const ds = useDataTableState();
  const table = useDataTableAuto({
    data: MOCK_USERS,
    columns: advancedColumns,
    ds,
  });

  return (
    <Card>
      <Card.Header className="border-b">
        <Card.Title>Advanced Table</Card.Title>
        <Card.Description>
          Table with selection, search, column visibility, and row actions
        </Card.Description>
      </Card.Header>

      <DataTable table={table}>
        <div className="px-4 pb-2">
          <DataTable.Toolbar />
        </div>
        <DataTable.Table className="border-y" />
        <Card.Footer className="pt-4">
          <DataTable.Pagination />
        </Card.Footer>
      </DataTable>
    </Card>
  );
}

const advancedColumns = [
  ch.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 8,
  }),
  ch.accessor("name", {
    header: ({ column }) => <DataTable.ColumnHeader column={column} title="Name" />,
    cell: (info) => info.getValue(),
  }),
  ch.accessor("email", {
    header: ({ column }) => <DataTable.ColumnHeader column={column} title="Email" />,
    cell: (info) => info.getValue(),
  }),
  ch.accessor("role", {
    header: ({ column }) => <DataTable.ColumnHeader column={column} title="Role" />,
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
  }),
  ch.display({
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="size-8 p-0" />}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit user</DropdownMenuItem>
            <DropdownMenuItem>View details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
];
