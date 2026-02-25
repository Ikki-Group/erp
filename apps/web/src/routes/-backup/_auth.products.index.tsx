import { createFileRoute, Link } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, Plus, FileDown } from "lucide-react";

import { DataTable } from "@/components/common/templates/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_auth/products/")({
  component: ProductsPage,
  staticData: {
    breadcrumb: "Products",
  },
});

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "archived" | "draft";
  lastUpdated: string;
};

const data: Product[] = [
  {
    id: "PRD-001",
    name: "Espresso Roast",
    category: "Coffee",
    price: 45.0,
    stock: 124,
    status: "active",
    lastUpdated: "2024-01-20",
  },
  {
    id: "PRD-002",
    name: "Vanilla Syrup (1L)",
    category: "Supplies",
    price: 12.5,
    stock: 45,
    status: "active",
    lastUpdated: "2024-01-18",
  },
  {
    id: "PRD-003",
    name: "Paper Cups 12oz",
    category: "Packaging",
    price: 25.0,
    stock: 1200,
    status: "active",
    lastUpdated: "2024-01-15",
  },
  {
    id: "PRD-004",
    name: "Oat Milk (Barista Ed.)",
    category: "Dairy",
    price: 4.2,
    stock: 8,
    status: "draft",
    lastUpdated: "2024-01-22",
  },
  {
    id: "PRD-005",
    name: "Ceramic Mug Blue",
    category: "Merchandise",
    price: 18.0,
    stock: 0,
    status: "archived",
    lastUpdated: "2023-12-10",
  },
  {
    id: "PRD-006",
    name: "Ethiopia Yirgacheffe",
    category: "Coffee",
    price: 52.0,
    stock: 35,
    status: "active",
    lastUpdated: "2024-01-21",
  },
];

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "id",
    header: "SKU",
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8"
        >
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "stock",
    header: () => <div className="text-right">Stock</div>,
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      return (
        <div
          className={cn(
            "text-right font-mono text-xs",
            stock <= 10 && "text-destructive font-bold",
          )}
        >
          {stock}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "active" ? "secondary" : status === "archived" ? "destructive" : "outline"
          }
          className="capitalize"
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.id)}>
              Copy Product ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/products/$productId" params={{ productId: product.id }}>
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/products/upsert">Edit product</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function ProductsPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">
            Manage your product inventory and pricing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" asChild>
            <Link to="/products/upsert">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Filter products..."
      />
    </div>
  );
}
