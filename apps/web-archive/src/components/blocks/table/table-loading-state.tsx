import { Loader2Icon } from 'lucide-react'

export function TableLoadingState(): React.ReactNode {
	return (
		<div className="flex w-full items-center justify-center py-12">
			<div className="flex flex-col items-center gap-2 text-muted-foreground">
				<Loader2Icon className="size-8 animate-spin" />
				<p className="text-sm">Memuat data...</p>
			</div>
		</div>
	)
}
