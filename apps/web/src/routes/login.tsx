import { useState, type FormEvent } from 'react'

import { createFileRoute, isRedirect, redirect, useNavigate } from '@tanstack/react-router'

import {
	ArrowRightIcon,
	EyeIcon,
	EyeOffIcon,
	LoaderIcon,
	LockKeyholeIcon,
	ShieldCheckIcon,
	StoreIcon,
	UserRoundIcon,
} from 'lucide-react'
import { z } from 'zod'

import { getStoredToken } from '@/lib/api/client.ts'
import { isApiError } from '@/lib/api/errors.ts'
import { queryClient } from '@/lib/tanstack-query.ts'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { authMeQuery } from '@/features/auth/api.ts'

import { useAuth } from '@/providers/auth-provider.tsx'

const loginSearchSchema = z.object({
	/** Where to send the user after signing in — set by `_authenticated`'s
	 * `beforeLoad` (or a forced logout) when it bounced them here. */
	redirect: z.string().optional().catch(''),
})

export const Route = createFileRoute('/login')({
	validateSearch: loginSearchSchema,
	beforeLoad: async ({ search }) => {
		// Do not probe a protected endpoint for an unauthenticated visitor.
		if (!getStoredToken()) return

		// If already authenticated, bounce back to wherever they were headed
		// (falling back to the dashboard) instead of always landing on `/`.
		try {
			const data = await queryClient.fetchQuery(authMeQuery.queryOptions())
			if (data?.data?.user) {
				throw redirect({ to: search.redirect || '/' })
			}
		} catch (error) {
			if (isRedirect(error)) throw error
			// Otherwise (401, network error) — let user stay on login
		}
	},
	component: LoginPage,
})

function LoginPage() {
	const navigate = useNavigate()
	const { redirect: redirectTo } = Route.useSearch()
	const { login } = useAuth()

	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setError(null)
		setIsSubmitting(true)

		try {
			await login({ username, password })
			navigate({ to: redirectTo || '/', replace: true })
		} catch (err) {
			if (isApiError(err)) {
				setError(err.friendlyMessage)
			} else {
				setError('Terjadi kesalahan yang tidak terduga.')
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<main className="min-h-svh bg-background text-foreground lg:grid lg:grid-cols-2">
			<section className="relative flex min-h-svh min-w-0 items-center justify-center overflow-hidden bg-background px-6 py-10 text-foreground sm:px-10 lg:order-2 lg:px-16">
				<div className="pointer-events-none absolute -top-36 -right-36 size-96 rounded-full bg-primary/10 blur-3xl" />
				<div className="pointer-events-none absolute -bottom-48 -left-24 size-96 rounded-full bg-accent-warm/10 blur-3xl" />

				<div className="relative w-full max-w-md">
					<div className="mb-10 flex items-center gap-3 lg:hidden">
						<BrandMark />
						<span className="text-sm font-semibold tracking-tight">Ikki ERP</span>
					</div>

					<div className="mb-9">
						<p className="mb-3 text-sm font-medium text-primary">Selamat datang kembali</p>
						<h1 className="text-foreground text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
							Masuk untuk mengelola bisnis Anda.
						</h1>
						<p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
							Satu ruang kerja untuk operasional, penjualan, dan tim Anda.
						</p>
					</div>

					<form
						onSubmit={handleSubmit}
						className="space-y-5"
						aria-describedby={error ? 'login-error' : undefined}
					>
						{error && (
							<Alert
								id="login-error"
								variant="destructive"
								className="border-destructive/25 bg-destructive/5 py-2.5"
							>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Label htmlFor="username" className="text-foreground">
								Nama pengguna
							</Label>
							<div className="relative">
								<UserRoundIcon
									aria-hidden="true"
									className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									id="username"
									name="username"
									type="text"
									autoComplete="username"
									required
									aria-invalid={Boolean(error) || undefined}
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									disabled={isSubmitting}
									placeholder="Masukkan nama pengguna"
									className="h-11 rounded-lg bg-background pl-10 text-sm text-foreground"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password" className="text-foreground">
									Kata sandi
								</Label>
							</div>
							<div className="relative">
								<LockKeyholeIcon
									aria-hidden="true"
									className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									autoComplete="current-password"
									required
									aria-invalid={Boolean(error) || undefined}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									disabled={isSubmitting}
									placeholder="Masukkan kata sandi"
									className="h-11 rounded-lg bg-background pr-12 pl-10 text-sm text-foreground"
								/>
								<button
									type="button"
									aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
									aria-controls="password"
									aria-pressed={showPassword}
									onClick={() => setShowPassword((visible) => !visible)}
									disabled={isSubmitting}
									className="absolute inset-y-0 right-0 flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
								>
									{showPassword ? (
										<EyeOffIcon aria-hidden="true" className="size-4" />
									) : (
										<EyeIcon aria-hidden="true" className="size-4" />
									)}
								</button>
							</div>
						</div>

						<Button
							type="submit"
							size="lg"
							className="h-11 w-full rounded-lg text-sm"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<LoaderIcon aria-hidden="true" className="size-4 animate-spin" />
							) : (
								<ArrowRightIcon aria-hidden="true" className="size-4" />
							)}
							{isSubmitting ? 'Memproses...' : 'Masuk ke ruang kerja'}
						</Button>
					</form>

					<div className="mt-8 flex items-start gap-2.5 border-t border-border/70 pt-5 text-xs leading-5 text-muted-foreground">
						<ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
						<p>Akses Anda dilindungi dan hanya dapat digunakan oleh anggota tim yang terdaftar.</p>
					</div>
				</div>
			</section>

			<section className="relative hidden min-w-0 overflow-hidden bg-invert text-invert-foreground lg:order-1 lg:block">
				<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-size-[44px_44px] opacity-20" />
				<div className="absolute -top-40 -left-40 size-136 rounded-full border border-invert-foreground/10" />
				<div className="absolute -top-24 -left-24 size-88 rounded-full border border-accent-warm/25" />
				<div className="absolute -right-32 -bottom-40 size-112 rounded-full bg-primary/30 blur-3xl" />

				<div className="relative flex h-full min-h-136 flex-col justify-between p-12 xl:p-16">
					<div className="flex items-center gap-3">
						<BrandMark inverted />
						<span className="text-sm font-semibold tracking-tight">Ikki ERP</span>
					</div>

					<div className="max-w-lg py-16">
						<div className="mb-7 flex size-14 items-center justify-center rounded-2xl border border-invert-foreground/15 bg-invert-foreground/10 backdrop-blur-sm">
							<StoreIcon aria-hidden="true" className="size-6 text-accent-warm" />
						</div>
						<h2 className="max-w-md text-4xl font-semibold leading-[1.08] tracking-tighter xl:text-5xl">
							Buat setiap hari operasional terasa lebih ringan.
						</h2>
						<p className="mt-6 max-w-sm text-sm leading-6 text-invert-foreground/65">
							Dari satu toko hingga banyak lokasi, Ikki membantu tim Anda tetap selaras dan bergerak
							maju.
						</p>
					</div>

					<div className="flex items-center justify-between border-t border-invert-foreground/15 pt-5 text-xs text-invert-foreground/45">
						<span>Ruang kerja Anda, satu sumber kebenaran.</span>
						<span className="hidden sm:inline">© Ikki</span>
					</div>
				</div>
			</section>
		</main>
	)
}

function BrandMark({ inverted = false }: { inverted?: boolean }) {
	return (
		<div
			className={`flex size-9 items-center justify-center rounded-xl ${inverted ? 'bg-invert-foreground text-invert' : 'bg-primary text-primary-foreground'}`}
		>
			<StoreIcon aria-hidden="true" className="size-4" />
		</div>
	)
}
