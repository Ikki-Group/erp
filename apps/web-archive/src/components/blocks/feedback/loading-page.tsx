export function LoadingPage() {
	return (
		<div className="flex flex-col h-full w-full items-center justify-center animate-fade-in gap-4">
			<div className="relative size-10">
				<div className="absolute inset-0 rounded-full border-2 border-border" />
				<div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
			</div>
			<p className="text-caption text-muted-foreground/70">Memuat...</p>
		</div>
	)
}
