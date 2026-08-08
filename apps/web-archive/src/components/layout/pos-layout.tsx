import type { ReactNode } from 'react'

export function PosLayout({ children }: { children: ReactNode }) {
	return (
		<div className="h-screen w-screen overflow-hidden bg-background">
			<div className="flex h-full w-full flex-col">
				{/* POS Header */}
				<header className="flex h-16 items-center justify-between border-b bg-card px-6">
					<div className="flex items-center gap-4">
						<h1 className="text-xl font-bold">POS</h1>
					</div>
					<div className="flex items-center gap-2">{/* Header actions will be added here */}</div>
				</header>
				{/* POS Content */}
				<main className="flex-1 overflow-hidden">{children}</main>
			</div>
		</div>
	)
}
