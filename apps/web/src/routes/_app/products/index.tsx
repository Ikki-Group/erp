import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  TrendingUpIcon,
  XIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ProductCategory, ProductStatus } from '@/features/products/types'
import { Page } from '@/components/layout/page'
import { Grid, Inline, Stack } from '@/components/common/layout/primitives'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  MOCK_PRODUCTS,
  formatCurrency,
  getCategoryLabel,
  getStatusLabel,
  getStockStatus,
} from '@/features/products/mock-data'

export const Route = createFileRoute('/_app/products/')({
  component: ProductsPage,
})

const ITEMS_PER_PAGE = 10

function ProductsPage() {
  const navigate = useNavigate()

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>(
    'all',
  )
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'critical'>(
    'all',
  )

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and paginate products
  const { filteredProducts, totalPages, paginatedProducts } = useMemo(() => {
    let filtered = MOCK_PRODUCTS

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query),
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    // Stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter((p) => {
        const status = getStockStatus(p.stock, p.minStock, p.reorderPoint)
        return status === stockFilter
      })
    }

    const total = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    return {
      filteredProducts: filtered,
      totalPages: total,
      paginatedProducts: paginated,
    }
  }, [searchQuery, categoryFilter, statusFilter, stockFilter, currentPage])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = MOCK_PRODUCTS.length
    const active = MOCK_PRODUCTS.filter((p) => p.status === 'active').length
    const lowStock = MOCK_PRODUCTS.filter(
      (p) => getStockStatus(p.stock, p.minStock, p.reorderPoint) === 'low',
    ).length
    const critical = MOCK_PRODUCTS.filter(
      (p) => getStockStatus(p.stock, p.minStock, p.reorderPoint) === 'critical',
    ).length
    const totalValue = MOCK_PRODUCTS.reduce(
      (sum, p) => sum + p.stock * p.price,
      0,
    )

    return { total, active, lowStock, critical, totalValue }
  }, [])

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setStockFilter('all')
    setCurrentPage(1)
  }

  const hasActiveFilters =
    searchQuery ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    stockFilter !== 'all'

  return (
    <Page size="xl">
      <Page.BlockHeader
        title="Produk"
        description="Kelola katalog produk, inventori, dan harga Anda"
        action={
          <Button size="sm" variant="outline" className="h-8 gap-2">
            <PlusIcon className="h-4 w-4" />
            Tambah Produk
          </Button>
        }
      />

      <Page.Content>
        <Stack gap="lg">
          {/* Statistics Cards */}
          <Grid cols={4} gap="md">
            <Card>
              <CardContent>
                <Stack gap="sm">
                  <p className="text-xs text-muted-foreground font-medium">
                    Total Produk
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{stats.total}</p>
                    <Badge variant="outline" className="text-xs">
                      {stats.active} aktif
                    </Badge>
                  </div>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack gap="sm">
                  <p className="text-xs text-muted-foreground font-medium">
                    Nilai Inventori
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">
                      {formatCurrency(stats.totalValue).replace('Rp', '')}
                    </p>
                    <Inline gap="sm" align="center">
                      <TrendingUpIcon className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">
                        +12.5%
                      </span>
                    </Inline>
                  </div>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack gap="sm">
                  <p className="text-xs text-muted-foreground font-medium">
                    Stok Rendah
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-orange-600">
                      {stats.lowStock}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs border-orange-500 text-orange-700"
                    >
                      Perlu perhatian
                    </Badge>
                  </div>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack gap="sm">
                  <p className="text-xs text-muted-foreground font-medium">
                    Stok Kritis
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-red-600">
                      {stats.critical}
                    </p>
                    <Inline gap="sm" align="center">
                      <AlertTriangleIcon className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-600 font-medium">
                        Mendesak
                      </span>
                    </Inline>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filter</CardTitle>
                  <CardDescription>
                    Cari dan filter produk berdasarkan kriteria tertentu
                  </CardDescription>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    <XIcon className="h-4 w-4" />
                    Hapus Filter
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cari</label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari produk..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        handleFilterChange()
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategori</label>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) => {
                      setCategoryFilter(value as ProductCategory | 'all')
                      handleFilterChange()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="raw-material">Bahan Baku</SelectItem>
                      <SelectItem value="semi-finished">
                        Setengah Jadi
                      </SelectItem>
                      <SelectItem value="finished-goods">
                        Barang Jadi
                      </SelectItem>
                      <SelectItem value="consumable">Habis Pakai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value as ProductStatus | 'all')
                      handleFilterChange()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                      <SelectItem value="discontinued">Dihentikan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Level Stok</label>
                  <Select
                    value={stockFilter}
                    onValueChange={(value) => {
                      setStockFilter(value as 'all' | 'low' | 'critical')
                      handleFilterChange()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Level</SelectItem>
                      <SelectItem value="low">Stok Rendah</SelectItem>
                      <SelectItem value="critical">Stok Kritis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results count */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Menampilkan{' '}
                  <span className="font-medium">
                    {paginatedProducts.length}
                  </span>{' '}
                  dari{' '}
                  <span className="font-medium">{filteredProducts.length}</span>{' '}
                  produk
                  {hasActiveFilters && ' (terfilter)'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Products List - Desktop Table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Kode
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Nama Produk
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Kategori
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Stok
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Harga
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <Stack gap="md" align="center">
                            <PackageIcon className="h-12 w-12 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                Produk tidak ditemukan
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Coba sesuaikan filter Anda
                              </p>
                            </div>
                          </Stack>
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((product) => {
                        const stockStatus = getStockStatus(
                          product.stock,
                          product.minStock,
                          product.reorderPoint,
                        )
                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() =>
                              navigate({
                                to: '/products/$id',
                                params: { id: product.id },
                              })
                            }
                          >
                            <td className="px-4 py-3">
                              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                {product.code}
                              </code>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-sm">
                                  {product.name}
                                </p>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(product.category)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${
                                    stockStatus === 'critical'
                                      ? 'text-red-600'
                                      : stockStatus === 'low'
                                        ? 'text-orange-600'
                                        : ''
                                  }`}
                                >
                                  {product.stock}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {product.unit}
                                </span>
                                {stockStatus !== 'normal' && (
                                  <AlertTriangleIcon
                                    className={`h-3 w-3 ${
                                      stockStatus === 'critical'
                                        ? 'text-red-500'
                                        : 'text-orange-500'
                                    }`}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm font-medium">
                                {formatCurrency(product.price)}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  product.status === 'active'
                                    ? 'default'
                                    : 'outline'
                                }
                                className={
                                  product.status === 'discontinued'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : ''
                                }
                              >
                                {getStatusLabel(product.status)}
                              </Badge>
                            </td>
                            <td
                              className="px-4 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Inline gap="sm" justify="end">
                                <Link
                                  to="/products/$id"
                                  params={{ id: product.id }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                  >
                                    Lihat
                                  </Button>
                                </Link>
                                <Link
                                  to="/products/$id"
                                  params={{ id: product.id }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                  >
                                    Ubah
                                  </Button>
                                </Link>
                              </Inline>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Products List - Mobile Cards */}
          <div className="md:hidden space-y-4">
            {paginatedProducts.length === 0 ? (
              <Card>
                <CardContent>
                  <Stack gap="md" align="center">
                    <PackageIcon className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium">Produk tidak ditemukan</p>
                      <p className="text-sm text-muted-foreground">
                        Coba sesuaikan filter Anda
                      </p>
                    </div>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              paginatedProducts.map((product) => {
                const stockStatus = getStockStatus(
                  product.stock,
                  product.minStock,
                  product.reorderPoint,
                )
                return (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() =>
                      navigate({
                        to: '/products/$id',
                        params: { id: product.id },
                      })
                    }
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <code className="text-xs bg-muted px-2 py-0.5 rounded">
                              {product.code}
                            </code>
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            product.status === 'active' ? 'default' : 'outline'
                          }
                          className={
                            product.status === 'discontinued'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : ''
                          }
                        >
                          {getStatusLabel(product.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Stack gap="sm">
                        <Inline justify="between" align="center">
                          <span className="text-sm text-muted-foreground">
                            Kategori
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(product.category)}
                          </Badge>
                        </Inline>

                        <Inline justify="between" align="center">
                          <span className="text-sm text-muted-foreground">
                            Stok
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                stockStatus === 'critical'
                                  ? 'text-red-600'
                                  : stockStatus === 'low'
                                    ? 'text-orange-600'
                                    : ''
                              }`}
                            >
                              {product.stock} {product.unit}
                            </span>
                            {stockStatus !== 'normal' && (
                              <AlertTriangleIcon
                                className={`h-4 w-4 ${
                                  stockStatus === 'critical'
                                    ? 'text-red-500'
                                    : 'text-orange-500'
                                }`}
                              />
                            )}
                          </div>
                        </Inline>

                        <Inline justify="between" align="center">
                          <span className="text-sm text-muted-foreground">
                            Harga
                          </span>
                          <span className="text-sm font-bold">
                            {formatCurrency(product.price)}
                          </span>
                        </Inline>

                        <div
                          className="pt-2 mt-2 border-t"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Inline gap="sm" justify="end">
                            <Link
                              to="/products/$id"
                              params={{ id: product.id }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                Lihat Detail
                              </Button>
                            </Link>
                          </Inline>
                        </div>
                      </Stack>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Halaman <span className="font-medium">{currentPage}</span>{' '}
                    dari <span className="font-medium">{totalPages}</span>
                  </p>

                  <Inline gap="sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      Pertama
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Sebelumnya
                    </Button>

                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-9"
                            >
                              {pageNum}
                            </Button>
                          )
                        },
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </Inline>
                </div>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Page.Content>
    </Page>
  )
}
