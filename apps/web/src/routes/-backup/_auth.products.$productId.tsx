import { createFileRoute } from "@tanstack/react-router";
import {
  Package,
  BarChart3,
  AlertCircle,
  Edit,
  MoreVertical,
  Calendar,
  DollarSign,
  Box,
  TrendingUp,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/products/$productId")({
  component: ProductDetailPage,
  staticData: {
    breadcrumb: "Product Details",
  },
});

// Mock data (matching products.tsx for consistency)
const productsData = [
  {
    id: "PRD-001",
    name: "Espresso Roast",
    category: "Coffee",
    price: 45.0,
    stock: 124,
    status: "active",
    lastUpdated: "2024-01-20",
    description:
      "Our signature dark roast with rich, intense flavor and a smooth finish. Perfect for espresso and milk-based drinks.",
    supplier: "RoastMasters Co.",
    sku: "SKU-ESP-001",
    warehouse: "Main A1",
  },
  {
    id: "PRD-002",
    name: "Vanilla Syrup (1L)",
    category: "Supplies",
    price: 12.5,
    stock: 45,
    status: "active",
    lastUpdated: "2024-01-18",
    description: "Premium vanilla syrup for flavoring coffee and other beverages.",
    supplier: "SweetSupplies Ltd.",
    sku: "SKU-VAN-002",
    warehouse: "Cold Store B2",
  },
];

function ProductDetailPage() {
  const { productId } = Route.useParams();

  // Find the product (in a real app, this would be a query)
  const product = productsData.find((p) => p.id === productId) || productsData[0];

  return (
    <div className="flex-1 space-y-6">
      {/* Header / Hero Section with Glassmorphism */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
        {/* Background Decorative Element */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] uppercase tracking-wider opacity-70"
                >
                  {product.id}
                </Badge>
                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                  {product.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="bg-background/50 backdrop-blur-sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Details
            </Button>
            <Button size="sm" className="shadow-lg shadow-primary/20">
              Update Inventory
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retail Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${product.price.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline mr-1 h-3 w-3 text-emerald-500" />
              +2.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Hand</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={cn("text-2xl font-bold", product.stock <= 20 ? "text-destructive" : "")}
            >
              {product.stock}
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Location: {product.warehouse}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center mt-1">
              <Badge
                variant={product.status === "active" ? "secondary" : "outline"}
                className="capitalize px-3 py-0.5"
              >
                {product.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Modified</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(product.lastUpdated).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">By System Administrator</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">
              Overview
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-background">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-background">
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4 outline-none">
          <div className="grid gap-4 md:grid-cols-7">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Description</CardTitle>
                <CardDescription>Detailed product information and specifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-balance leading-relaxed">{product.description}</p>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Supplier</p>
                    <p className="text-sm font-semibold">{product.supplier}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Manufacturer SKU
                    </p>
                    <p className="text-sm font-semibold">{product.sku}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Created At
                    </p>
                    <p className="text-sm font-semibold">Dec 12, 2023</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-3 bg-muted/20 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-xs h-8">
                  Generate Barcode
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs h-8">
                  Export Spec Sheet (PDF)
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs h-8">
                  Duplicate Product
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-8 text-destructive hover:text-destructive"
                >
                  Archive Entity
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Track stock levels across different warehouses and locations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Inventory tracking details will appear here.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Change History</CardTitle>
              <CardDescription>
                Audit log of all modifications to this product record.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Inventory updated - Added 12 units
                      </p>
                      <p className="text-xs text-muted-foreground">2 days ago • by Sarah Miller</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
