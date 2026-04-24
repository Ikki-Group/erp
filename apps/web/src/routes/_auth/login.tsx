import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'

import { ArrowRightIcon, CheckCircle2Icon, CommandIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAppState } from '@/hooks/use-app-state'

import { zEmail, zPassword } from '@/lib/zod/primitive'

import { useAppForm } from '@/components/form'

import { Button } from '@/components/ui/button'
import { FieldSeparator } from '@/components/ui/field'

import { authApi } from '@/features/auth'

export const Route = createFileRoute('/_auth/login')({
	validateSearch: zodValidator(
		z.object({
			redirectTo: z
				.string()
				.optional()
				.transform((val) => val ?? undefined),
		}),
	),
	component: LoginPage,
})

function LoginPage() {
	return (
		<div className="relative flex min-h-svh lg:grid lg:grid-cols-2 lg:px-0">
			<BrandingSection />
			<div className="lg:p-8 flex w-full items-center justify-center bg-background">
				<LoginForm />
			</div>
		</div>
	)
}

function BrandingSection() {
	return (
		<div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex border-r border-border/50">
			<div className="absolute inset-0 bg-zinc-950" />
			<div className="absolute inset-0 bg-linear-to-br from-blue-600/20 via-transparent to-blue-500/10" />

			{/* Decorative Gradients */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[120px] mix-blend-screen animate-pulse" />
				<div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen" />
				<div
					className="absolute inset-0 opacity-15"
					style={{
						backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
						backgroundSize: '24px 24px',
					}}
				/>
			</div>

			<div className="relative z-20 flex items-center text-xl font-bold tracking-tight">
				<div className="rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 p-2.5 mr-3">
					<CommandIcon className="h-6 w-6 text-white" />
				</div>
				IKKI ERP
			</div>

			<div className="relative z-20 mt-auto">
				<blockquote className="space-y-4 max-w-lg">
					<p className="text-2xl font-medium leading-relaxed tracking-tight text-zinc-100">
						&ldquo;Ecosystem manajemen enterprise modern yang membantu bisnis Anda bertransformasi
						dengan efisiensi maksimal.&rdquo;
					</p>
					<footer className="text-sm text-zinc-400 font-medium">
						IKKI ERP — Intelligence, Key results, Knowledge, Integration.
					</footer>
				</blockquote>
			</div>
		</div>
	)
}

const loginSchema = z.object({
	identifier: zEmail,
	password: zPassword,
})

function LoginForm() {
	const { redirectTo } = Route.useSearch()
	const navigate = Route.useNavigate()

	const loginMutation = useMutation({
		mutationFn: authApi.login.mutationFn,
		onSuccess: ({ data }) => {
			const { token, user } = data
			useAppState.getState().setToken(token, user)

			toast.success('Login Berhasil', {
				description: 'Selamat datang kembali di IKKI ERP.',
				icon: <CheckCircle2Icon className="text-success" />,
			})

			navigate({ to: redirectTo ?? '/' })
		},
		onError: () =>
			toast.error('Login Gagal', {
				description: 'Silakan periksa kembali email dan password Anda.',
			}),
	})

	const form = useAppForm({
		defaultValues: { identifier: '', password: '' },
		validators: {
			onChange: loginSchema,
		},
		onSubmit: async ({ value }) => {
			await loginMutation.mutateAsync({
				body: value,
			})
		},
	})

	return (
		<div className="mx-auto flex w-full max-w-[400px] flex-col justify-center space-y-8 p-4 sm:p-0">
			<div className="flex flex-col space-y-2.5 text-center sm:text-left">
				<h1 className="text-3xl font-bold tracking-[-0.75px]">Selamat Datang</h1>
				<p className="text-muted-foreground">Masukkan kredensial Anda untuk mengakses dashboard.</p>
			</div>

			<form.AppForm>
				<form.Form className="space-y-5">
					<form.AppField name="identifier">
						{(field) => (
							<field.Input
								label="Email"
								required
								type="email"
								placeholder="user@example.com"
								autoFocus
							/>
						)}
					</form.AppField>
					<form.AppField name="password">
						{(field) => (
							<field.InputPassword
								label="Password"
								required
								autoComplete="current-password"
								placeholder="••••••••"
							/>
						)}
					</form.AppField>

					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								size="lg"
								disabled={!canSubmit || isSubmitting}
								className="group relative w-full overflow-hidden font-semibold transition-all hover:shadow-lg hover:shadow-primary/15 active:scale-[0.98]"
							>
								<div className="flex items-center justify-center gap-2">
									{isSubmitting ? (
										<Loader2Icon className="h-4 w-4 animate-spin" />
									) : (
										<>
											<span>Masuk</span>
											<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
										</>
									)}
								</div>
								{isSubmitting && (
									<div className="absolute inset-0 flex items-center justify-center bg-primary">
										<Loader2Icon className="h-5 w-5 animate-spin" />
									</div>
								)}
							</Button>
						)}
					</form.Subscribe>
				</form.Form>
			</form.AppForm>

			<FieldSeparator>Atau</FieldSeparator>

			<div className="flex flex-col space-y-4 text-center mt-4">
				<p className="text-sm text-muted-foreground">
					Belum punya akun?{' '}
					<Button
						variant="link"
						className="p-0 h-auto font-semibold text-primary hover:underline hover:underline-offset-4"
						onClick={() =>
							toast.info('Pendaftaran', {
								description: 'Hubungi administrator sistem untuk pembuatan akun baru perusahaan.',
							})
						}
					>
						Hubungi Admin
					</Button>
				</p>
			</div>

			<div className="text-center text-[11px] text-muted-foreground/60">
				Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
			</div>
		</div>
	)
}
