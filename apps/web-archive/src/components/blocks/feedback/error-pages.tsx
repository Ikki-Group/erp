import { Link } from '@tanstack/react-router'

import {
	AlertTriangleIcon,
	ArrowLeftIcon,
	FileQuestionIcon,
	HomeIcon,
	RefreshCwIcon,
	ServerCrashIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { Inline, Stack } from '@/components/layout/primitives'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorPageProps {
	title: string
	description: string
	icon: React.ReactNode
	actions?: React.ReactNode
	showBackButton?: boolean
	showHomeButton?: boolean
	showRefreshButton?: boolean
}

// Base icon size for error pages
const ICON_SIZE = 'h-16 w-16'

// Base icon stroke width
const ICON_STROKE = 'stroke-[1.5]'

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
		<div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
			<Card className="w-full max-w-md shadow-lg border">
				<CardContent className="space-y-6 p-8">
					{/* Icon */}
					<div className="relative mx-auto flex h-24 w-24 items-center justify-center">
						<div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
						<div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20 p-4">
							{icon}
						</div>
					</div>

					{/* Content */}
					<Stack gap="sm" align="center" className="text-center">
						<h1 className="text-xl font-semibold tracking-tight">{title}</h1>
						<p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{description}</p>
					</Stack>

					{/* Actions */}
					<div className="w-full">
						{actions ?? (
							<Inline gap="sm" justify="center" className="flex-wrap">
								{showBackButton && (
									<Button variant="outline" size="default" onClick={() => window.history.back()}>
										<ArrowLeftIcon />
										Kembali
									</Button>
								)}
								{showHomeButton && (
									<Link to="/">
										<Button size="default">
											<HomeIcon />
											Ke Beranda
										</Button>
									</Link>
								)}
								{showRefreshButton && (
									<Button variant="outline" size="default" onClick={() => window.location.reload()}>
										<RefreshCwIcon />
										Muat Ulang
									</Button>
								)}
							</Inline>
						)}
					</div>
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
			icon={<FileQuestionIcon className={cn(ICON_SIZE, 'text-primary', ICON_STROKE)} />}
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
			icon={<ServerCrashIcon className={cn(ICON_SIZE, 'text-destructive', ICON_STROKE)} />}
			showHomeButton
			showRefreshButton
			showBackButton={false}
		/>
	)
}

// Generic Error
export function GenericErrorPage({ error, reset }: { error?: Error; reset?: () => void }) {
	return (
		<ErrorPageLayout
			title="Terjadi Kesalahan"
			description={
				error?.message ?? 'Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.'
			}
			icon={<AlertTriangleIcon className={cn(ICON_SIZE, 'text-orange-500', ICON_STROKE)} />}
			actions={
				<Inline gap="sm" justify="center" className="flex-wrap">
					{reset && (
						<Button size="default" onClick={reset}>
							<RefreshCwIcon />
							Coba Lagi
						</Button>
					)}
					<Link to="/">
						<Button variant="outline" size="default">
							<HomeIcon />
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
			icon={<ServerCrashIcon className={cn(ICON_SIZE, 'text-blue-500', ICON_STROKE)} />}
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
			icon={<AlertTriangleIcon className={cn(ICON_SIZE, 'text-orange-500', ICON_STROKE)} />}
			actions={
				<Inline gap="sm" justify="center" className="flex-wrap">
					<Button variant="outline" size="default" onClick={() => window.history.back()}>
						<ArrowLeftIcon />
						Kembali
					</Button>
					<Link to="/">
						<Button size="default">
							<HomeIcon />
							Ke Beranda
						</Button>
					</Link>
				</Inline>
			}
		/>
	)
}
