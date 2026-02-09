import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Stack, Inline } from '@/components/common/layout/primitives'
import {
  AlertTriangleIcon,
  FileQuestionIcon,
  ServerCrashIcon,
  HomeIcon,
  RefreshCwIcon,
  ArrowLeftIcon,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

interface ErrorPageProps {
  title: string
  description: string
  icon: React.ReactNode
  actions?: React.ReactNode
  showBackButton?: boolean
  showHomeButton?: boolean
  showRefreshButton?: boolean
}

function ErrorPageLayout({
  title,
  description,
  icon,
  actions,
  showBackButton = true,
  showHomeButton = true,
  showRefreshButton = false,
}: ErrorPageProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-linear-to-br from-background via-muted/20 to-background">
      <Card className="max-w-lg w-full shadow-xl border-2">
        <CardContent className="pt-12 pb-8">
          <Stack gap="lg" align="center">
            {/* Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
              <div className="relative bg-linear-to-br from-primary/20 to-primary/5 p-6 rounded-2xl border-2 border-primary/20">
                {icon}
              </div>
            </div>

            {/* Content */}
            <Stack gap="sm" align="center" className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground text-lg max-w-md">
                {description}
              </p>
            </Stack>

            {/* Actions */}
            <div className="w-full mt-4">
              {actions ? (
                actions
              ) : (
                <Inline gap="sm" justify="center" className="flex-wrap">
                  {showBackButton && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => window.history.back()}
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      Kembali
                    </Button>
                  )}
                  {showHomeButton && (
                    <Link to="/">
                      <Button size="lg">
                        <HomeIcon className="h-4 w-4" />
                        Ke Beranda
                      </Button>
                    </Link>
                  )}
                  {showRefreshButton && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCwIcon className="h-4 w-4" />
                      Muat Ulang
                    </Button>
                  )}
                </Inline>
              )}
            </div>
          </Stack>
        </CardContent>
      </Card>
    </div>
  )
}

// 404 - Not Found
export function NotFoundPage() {
  return (
    <ErrorPageLayout
      title="Halaman Tidak Ditemukan"
      description="Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman telah dipindahkan atau dihapus."
      icon={
        <FileQuestionIcon className="h-16 w-16 text-primary stroke-[1.5]" />
      }
      showBackButton
      showHomeButton
    />
  )
}

// 500 - Server Error
export function ServerErrorPage() {
  return (
    <ErrorPageLayout
      title="Terjadi Kesalahan Server"
      description="Maaf, terjadi kesalahan pada server kami. Tim kami telah diberitahu dan sedang memperbaikinya. Silakan coba lagi nanti."
      icon={
        <ServerCrashIcon className="h-16 w-16 text-destructive stroke-[1.5]" />
      }
      showHomeButton
      showRefreshButton
      showBackButton={false}
    />
  )
}

// Generic Error
export function GenericErrorPage({
  error,
  reset,
}: {
  error?: Error
  reset?: () => void
}) {
  return (
    <ErrorPageLayout
      title="Terjadi Kesalahan"
      description={
        error?.message ||
        'Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.'
      }
      icon={
        <AlertTriangleIcon className="h-16 w-16 text-orange-500 stroke-[1.5]" />
      }
      actions={
        <Inline gap="sm" justify="center" className="flex-wrap">
          {reset && (
            <Button size="lg" onClick={reset}>
              <RefreshCwIcon className="h-4 w-4" />
              Coba Lagi
            </Button>
          )}
          <Link to="/">
            <Button variant="outline" size="lg">
              <HomeIcon className="h-4 w-4" />
              Ke Beranda
            </Button>
          </Link>
        </Inline>
      }
    />
  )
}

// Maintenance Mode
export function MaintenancePage() {
  return (
    <ErrorPageLayout
      title="Sedang Dalam Pemeliharaan"
      description="Kami sedang melakukan pemeliharaan sistem untuk meningkatkan layanan. Mohon kembali lagi dalam beberapa saat."
      icon={
        <ServerCrashIcon className="h-16 w-16 text-blue-500 stroke-[1.5]" />
      }
      showHomeButton={false}
      showBackButton={false}
      showRefreshButton
    />
  )
}

// Unauthorized
export function UnauthorizedPage() {
  return (
    <ErrorPageLayout
      title="Akses Ditolak"
      description="Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan."
      icon={
        <AlertTriangleIcon className="h-16 w-16 text-orange-500 stroke-[1.5]" />
      }
      actions={
        <Inline gap="sm" justify="center" className="flex-wrap">
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali
          </Button>
          <Link to="/">
            <Button size="lg">
              <HomeIcon className="h-4 w-4" />
              Ke Beranda
            </Button>
          </Link>
        </Inline>
      }
    />
  )
}
