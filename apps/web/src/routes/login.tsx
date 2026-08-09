import { useState } from 'react'

import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { AlertCircleIcon, LoaderIcon } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { isApiError } from '@/lib/api/errors.ts'
import { queryClient } from '@/lib/tanstack-query.ts'

import { authMeQuery } from '@/features/auth/api.ts'
import { useAuth } from '@/providers/auth-provider.tsx'

export const Route = createFileRoute('/login')({
	beforeLoad: async () => {
		// If already authenticated, redirect to dashboard
		try {
			const data = await queryClient.fetchQuery(authMeQuery.queryOptions(undefined as never))
			if (data?.data?.user) {
				throw redirect({ to: '/' })
			}
		} catch (error) {
			// If it's a redirect, rethrow
			if (error instanceof Error && 'to' in error) throw error
			// Otherwise (401, network error) — let user stay on login
		}
	},
	component: LoginPage,
})

function LoginPage() {
	const navigate = useNavigate()
	const { login } = useAuth()

	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setError(null)
		setIsSubmitting(true)

		try {
			await login({ username, password })
			navigate({ to: '/', replace: true })
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
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Ikki ERP</CardTitle>
					<CardDescription>Masuk ke akun Anda</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertCircleIcon className="size-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-1.5">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								name="username"
								type="text"
								autoComplete="username"
								required
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								disabled={isSubmitting}
								placeholder="username"
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isSubmitting}
								placeholder="••••••••"
							/>
						</div>

						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting && <LoaderIcon className="mr-2 size-4 animate-spin" />}
							Masuk
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
