import {
  Page,
  PageHeader,
  PageHeaderContent,
  PageTitleContainer,
  PageTitle,
  PageDescription,
  PageActions,
  PageContent,
  PageBreadcrumb,
} from '@/components/layout/page'
import { Grid, Stack, Inline } from '@/components/common/layout/primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DescriptionList,
  DescriptionItem,
} from '@/components/common/data-display/description-list'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  HomeIcon,
  ChevronRightIcon,
  PackageIcon,
  EditIcon,
  TrashIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
} from 'lucide-react'
import {
  getProductById,
  formatCurrency,
  getCategoryLabel,
  getStatusLabel,
  getUnitLabel,
  getStockStatus,
} from '@/features/products/mock-data'

export const Route = createFileRoute('/_app/products/$id')({
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const product = getProductById(id)

  if (!product) {
    return (
      <Page>
        <PageContent>
          <Card>
            <CardContent>
              <Stack gap="md" align="center">
                <AlertTriangleIcon className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-medium">Product Not Found</h3>
                  <p className="text-sm text-muted-foreground">
                    The product you're looking for doesn't exist.
                  </p>
                </div>
                <Button onClick={() => navigate({ to: '/products' })}>
                  Back to Products
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </PageContent>
      </Page>
    )
  }

  const stockStatus = getStockStatus(
    product.stock,
    product.minStock,
    product.reorderPoint,
  )

  const basicInfo: DescriptionItem[] = [
    {
      term: 'Product Code',
      description: (
        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
          {product.code}
        </code>
      ),
    },
    {
      term: 'Product Name',
      description: <span className="font-medium">{product.name}</span>,
    },
    {
      term: 'Category',
      description: (
        <Badge variant="outline">{getCategoryLabel(product.category)}</Badge>
      ),
    },
    {
      term: 'Status',
      description: (
        <Badge
          variant={product.status === 'active' ? 'default' : 'outline'}
          className={
            product.status === 'discontinued'
              ? 'bg-red-50 text-red-700 border-red-200'
              : ''
          }
        >
          {getStatusLabel(product.status)}
        </Badge>
      ),
    },
    {
      term: 'Description',
      description: product.description || '-',
      className: 'md:col-span-2',
    },
  ]

  const inventoryInfo: DescriptionItem[] = [
    {
      term: 'Current Stock',
      description: (
        <div className="flex items-center gap-2">
          <span
            className={`text-lg font-bold ${
              stockStatus === 'critical'
                ? 'text-red-600'
                : stockStatus === 'low'
                  ? 'text-orange-600'
                  : 'text-green-600'
            }`}
          >
            {product.stock}
          </span>
          <span className="text-sm text-muted-foreground">
            {getUnitLabel(product.unit)}
          </span>
          {stockStatus !== 'normal' && (
            <Badge
              variant="outline"
              className={
                stockStatus === 'critical'
                  ? 'border-red-500 text-red-700'
                  : 'border-orange-500 text-orange-700'
              }
            >
              {stockStatus === 'critical' ? 'Critical' : 'Low Stock'}
            </Badge>
          )}
        </div>
      ),
    },
    {
      term: 'Unit',
      description: getUnitLabel(product.unit),
    },
    {
      term: 'Minimum Stock',
      description: `${product.minStock} ${product.unit}`,
    },
    {
      term: 'Maximum Stock',
      description: `${product.maxStock} ${product.unit}`,
    },
    {
      term: 'Reorder Point',
      description: `${product.reorderPoint} ${product.unit}`,
    },
    {
      term: 'Stock Value',
      description: (
        <span className="font-bold text-lg">
          {formatCurrency(product.stock * product.price)}
        </span>
      ),
    },
  ]

  const pricingInfo: DescriptionItem[] = [
    {
      term: 'Selling Price',
      description: (
        <span className="text-lg font-bold">
          {formatCurrency(product.price)}
        </span>
      ),
    },
    {
      term: 'Cost Price',
      description: formatCurrency(product.cost),
    },
    {
      term: 'Profit Margin',
      description: (
        <div className="flex items-center gap-2">
          <span className="font-medium text-green-600">
            {(((product.price - product.cost) / product.price) * 100).toFixed(
              1,
            )}
            %
          </span>
          <TrendingUpIcon className="h-4 w-4 text-green-500" />
        </div>
      ),
    },
    {
      term: 'Profit per Unit',
      description: (
        <span className="font-medium">
          {formatCurrency(product.price - product.cost)}
        </span>
      ),
    },
  ]

  const additionalInfo: DescriptionItem[] = [
    ...(product.supplier
      ? [
          {
            term: 'Supplier',
            description: product.supplier,
          },
        ]
      : []),
    ...(product.barcode
      ? [
          {
            term: 'Barcode',
            description: (
              <code className="bg-muted px-2 py-1 rounded text-sm">
                {product.barcode}
              </code>
            ),
          },
        ]
      : []),
    ...(product.sku
      ? [
          {
            term: 'SKU',
            description: (
              <code className="bg-muted px-2 py-1 rounded text-sm">
                {product.sku}
              </code>
            ),
          },
        ]
      : []),
    ...(product.weight
      ? [
          {
            term: 'Weight',
            description: `${product.weight} kg`,
          },
        ]
      : []),
    ...(product.dimensions
      ? [
          {
            term: 'Dimensions (L×W×H)',
            description: `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} cm`,
          },
        ]
      : []),
  ]

  const systemInfo: DescriptionItem[] = [
    {
      term: 'Created At',
      description: product.createdAt.toLocaleDateString('id-ID', {
        dateStyle: 'long',
      }),
    },
    {
      term: 'Created By',
      description: product.createdBy,
    },
    {
      term: 'Last Updated',
      description: product.updatedAt.toLocaleDateString('id-ID', {
        dateStyle: 'long',
      }),
    },
    {
      term: 'Updated By',
      description: product.updatedBy,
    },
  ]

  return (
    <Page size="lg">
      <PageHeader sticky>
        <PageHeaderContent>
          <Stack gap="sm">
            <PageBreadcrumb>
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground"
              >
                <HomeIcon className="h-4 w-4" />
              </Link>
              <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />
              <Link
                to="/products"
                className="text-muted-foreground hover:text-foreground"
              >
                Products
              </Link>
              <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{product.code}</span>
            </PageBreadcrumb>

            <PageTitleContainer>
              <Inline gap="sm" align="center">
                <PackageIcon className="h-7 w-7 text-primary" />
                <PageTitle size="md" truncate>
                  {product.name}
                </PageTitle>
              </Inline>
              <PageDescription>
                {getCategoryLabel(product.category)} • {product.code}
              </PageDescription>
            </PageTitleContainer>
          </Stack>

          <PageActions>
            <Link to="/products/$id" params={{ id: product.id }}>
              <Button variant="outline" size="sm">
                <EditIcon className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="text-red-600">
              <TrashIcon className="h-4 w-4" />
              Delete
            </Button>
          </PageActions>
        </PageHeaderContent>
      </PageHeader>

      <PageContent>
        <Stack gap="lg">
          {/* Stock Alert */}
          {stockStatus !== 'normal' && (
            <Card
              className={
                stockStatus === 'critical'
                  ? 'border-red-200 bg-red-50'
                  : 'border-orange-200 bg-orange-50'
              }
            >
              <CardContent>
                <Inline gap="md" align="center">
                  <AlertTriangleIcon
                    className={`h-5 w-5 ${
                      stockStatus === 'critical'
                        ? 'text-red-600'
                        : 'text-orange-600'
                    }`}
                  />
                  <div>
                    <p
                      className={`font-medium ${
                        stockStatus === 'critical'
                          ? 'text-red-900'
                          : 'text-orange-900'
                      }`}
                    >
                      {stockStatus === 'critical'
                        ? 'Critical Stock Level'
                        : 'Low Stock Warning'}
                    </p>
                    <p
                      className={`text-sm ${
                        stockStatus === 'critical'
                          ? 'text-red-700'
                          : 'text-orange-700'
                      }`}
                    >
                      Current stock ({product.stock} {product.unit}) is{' '}
                      {stockStatus === 'critical'
                        ? 'below minimum'
                        : 'below reorder point'}
                      . Consider restocking soon.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={stockStatus === 'critical' ? 'default' : 'outline'}
                    className="ml-auto"
                  >
                    Create Purchase Order
                  </Button>
                </Inline>
              </CardContent>
            </Card>
          )}

          <Grid cols={2}>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Product details and classification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DescriptionList
                  items={basicInfo}
                  columns={1}
                  className="sm:grid-cols-2"
                />
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>
                  Cost and selling price details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DescriptionList items={pricingInfo} variant="bordered" />
              </CardContent>
            </Card>
          </Grid>

          {/* Inventory Information */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Stock levels and thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <DescriptionList
                items={inventoryInfo}
                columns={1}
                className="sm:grid-cols-2 lg:grid-cols-3"
              />
            </CardContent>
          </Card>

          {/* Additional Information */}
          {additionalInfo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
                <CardDescription>
                  Supplier, identifiers, and physical specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DescriptionList
                  items={additionalInfo}
                  columns={1}
                  className="sm:grid-cols-2"
                />
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <Inline gap="sm" wrap>
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </Inline>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Audit trail and metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <DescriptionList
                items={systemInfo}
                columns={1}
                className="sm:grid-cols-2"
              />
            </CardContent>
          </Card>
        </Stack>
      </PageContent>
    </Page>
  )
}
