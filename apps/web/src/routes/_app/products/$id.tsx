import { Page } from '@/components/layout/page'
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
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangleIcon,
  TrendingUpIcon,
  PlusIcon,
  FileDownIcon,
  FileUpIcon,
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
        <Page.Content>
          <Card>
            <CardContent>
              <Stack gap="md" align="center">
                <AlertTriangleIcon className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-medium">Produk Tidak Ditemukan</h3>
                  <p className="text-sm text-muted-foreground">
                    Produk yang Anda cari tidak ditemukan.
                  </p>
                </div>
                <Button onClick={() => navigate({ to: '/products' })}>
                  Kembali ke Produk
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Page.Content>
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
      term: 'Kode Produk',
      description: (
        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
          {product.code}
        </code>
      ),
    },
    {
      term: 'Nama Produk',
      description: <span className="font-medium">{product.name}</span>,
    },
    {
      term: 'Kategori',
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
      term: 'Deskripsi',
      description: product.description || '-',
      className: 'md:col-span-2',
    },
  ]

  const inventoryInfo: DescriptionItem[] = [
    {
      term: 'Stok Saat Ini',
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
              {stockStatus === 'critical' ? 'Mendesak' : 'Stok Rendah'}
            </Badge>
          )}
        </div>
      ),
    },
    {
      term: 'Satuan',
      description: getUnitLabel(product.unit),
    },
    {
      term: 'Stok Minimum',
      description: `${product.minStock} ${product.unit}`,
    },
    {
      term: 'Stok Maksimum',
      description: `${product.maxStock} ${product.unit}`,
    },
    {
      term: 'Titik Pemesanan Ulang',
      description: `${product.reorderPoint} ${product.unit}`,
    },
    {
      term: 'Nilai Stok',
      description: (
        <span className="font-bold text-lg">
          {formatCurrency(product.stock * product.price)}
        </span>
      ),
    },
  ]

  const pricingInfo: DescriptionItem[] = [
    {
      term: 'Harga Jual',
      description: (
        <span className="text-lg font-bold">
          {formatCurrency(product.price)}
        </span>
      ),
    },
    {
      term: 'Harga Pokok',
      description: formatCurrency(product.cost),
    },
    {
      term: 'Margin Keuntungan',
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
      term: 'Keuntungan per Unit',
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
            term: 'Pemasok',
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
            term: 'Berat',
            description: `${product.weight} kg`,
          },
        ]
      : []),
    ...(product.dimensions
      ? [
          {
            term: 'Dimensi (P×L×T)',
            description: `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} cm`,
          },
        ]
      : []),
  ]

  const systemInfo: DescriptionItem[] = [
    {
      term: 'Dibuat Pada',
      description: product.createdAt.toLocaleDateString('id-ID', {
        dateStyle: 'long',
      }),
    },
    {
      term: 'Dibuat Oleh',
      description: product.createdBy,
    },
    {
      term: 'Terakhir Diperbarui',
      description: product.updatedAt.toLocaleDateString('id-ID', {
        dateStyle: 'long',
      }),
    },
    {
      term: 'Diperbarui Oleh',
      description: product.updatedBy,
    },
  ]

  return (
    <Page size="lg">
      <Page.BlockHeader
        title="Produk"
        description="Kelola katalog produk, inventori, dan harga Anda"
        action={
          <>
            <Button variant="outline" size="sm">
              <FileUpIcon className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <FileDownIcon className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Tambah Produk
            </Button>
          </>
        }
      />

      <Page.Content>
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
                        ? 'Level Stok Kritis'
                        : 'Peringatan Stok Rendah'}
                    </p>
                    <p
                      className={`text-sm ${
                        stockStatus === 'critical'
                          ? 'text-red-700'
                          : 'text-orange-700'
                      }`}
                    >
                      Stok saat ini ({product.stock} {product.unit}) berada di{' '}
                      {stockStatus === 'critical'
                        ? 'bawah minimum'
                        : 'bawah titik pemesanan ulang'}
                      . Pertimbangkan untuk melakukan restok segera.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={stockStatus === 'critical' ? 'default' : 'outline'}
                    className="ml-auto"
                  >
                    Buat Purchase Order
                  </Button>
                </Inline>
              </CardContent>
            </Card>
          )}

          <Grid cols={2}>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
                <CardDescription>Detail dan klasifikasi produk</CardDescription>
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
                <CardTitle>Harga</CardTitle>
                <CardDescription>Detail harga jual dan biaya</CardDescription>
              </CardHeader>
              <CardContent>
                <DescriptionList items={pricingInfo} variant="bordered" />
              </CardContent>
            </Card>
          </Grid>

          {/* Inventory Information */}
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Inventori</CardTitle>
              <CardDescription>Level stok dan ambang batas</CardDescription>
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
                <CardTitle>Detail Tambahan</CardTitle>
                <CardDescription>
                  Supplier, identifikasi, dan spesifikasi fisik
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
                <CardTitle>Tag</CardTitle>
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
              <CardTitle>Informasi Sistem</CardTitle>
              <CardDescription>Jejak audit dan metadata</CardDescription>
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
      </Page.Content>
    </Page>
  )
}
