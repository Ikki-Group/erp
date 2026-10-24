import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface TableErrorStateProps {
	title?: string
	message?: string
	onRetry?: () => void
}

export function TableErrorState({
	title = 'Terjadi kesalahan',
	message = 'Gagal memuat data. Silakan coba lagi.',
	onRetry,
}: TableErrorStateProps) {
	return (
		<div className="flex items-center justify-center py-8">
			<Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
				<div className="flex items-start gap-4 p-6">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
						<AlertCircleIcon className="size-5 text-destructive" />
					</div>
					<div className="flex-1 space-y-2">
						<h3 className="font-semibold text-foreground">{title}</h3>
						<p className="text-sm text-muted-foreground">{message}</p>
					</div>
				</div>
				{onRetry && (
					<div className="flex justify-end p-4 pt-0">
						<Button variant="outline" size="sm" onClick={onRetry}>
							<RefreshCwIcon className="mr-2 size-4" />
							Coba Lagi
						</Button>
					</div>
				)}
			</Card>
		</div>
	)
}
