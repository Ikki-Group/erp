import { Link } from '@tanstack/react-router'

import { FileQuestionIcon, HomeIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

export interface NotFoundProps {
	title?: string
	description?: string
	showHomeLink?: boolean
	className?: string
}

/**
 * 404 Not Found page component.
 * Can render standalone (outside app shell) or inside the app shell.
 */
export function NotFound({
	title = 'Page not found',
	description = "The page you're looking for doesn't exist or has been moved.",
	showHomeLink = true,
	className,
}: NotFoundProps) {
	return (
		<div
			className={cn(
				'flex min-h-[50vh] flex-col items-center justify-center text-center',
				className,
			)}
		>
			<div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<FileQuestionIcon className="size-7" />
			</div>
			<h1 className="text-2xl font-semibold tracking-tight">404</h1>
			<p className="mt-1 text-lg font-medium">{title}</p>
			<p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
			{showHomeLink && (
				<Link to="/" className="mt-6">
					<Button variant="outline" size="sm" className="gap-1.5">
						<HomeIcon className="size-3.5" />
						Back to Home
					</Button>
				</Link>
			)}
		</div>
	)
}
