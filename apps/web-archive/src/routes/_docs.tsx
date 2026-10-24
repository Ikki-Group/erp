import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import {
	ArrowLeftIcon,
	BookOpenIcon,
	ComponentIcon,
	FileTextIcon,
	LayersIcon,
	LayoutDashboardIcon,
	PaletteIcon,
	TableIcon,
} from 'lucide-react'

import { componentRegistry } from '@/components/registry'

export const Route = createFileRoute('/_docs')({ component: DocsLayout })

const layerIcons: Record<string, typeof ComponentIcon> = {
	layout: LayoutDashboardIcon,
	form: PaletteIcon,
	'data-table': TableIcon,
	blocks: LayersIcon,
	providers: ComponentIcon,
}

function DocsLayout() {
	return (
		<div className="flex min-h-dvh bg-background">
			{/* Sidebar */}
			<aside className="w-64 border-r bg-muted/30 flex flex-col shrink-0 sticky top-0 h-dvh overflow-y-auto">
				<div className="p-4 border-b">
					<Link
						to="/"
						className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeftIcon className="size-4" />
						Kembali ke App
					</Link>
				</div>
				<div className="p-4 border-b">
					<div className="flex items-center gap-2">
						<BookOpenIcon className="size-5 text-primary" />
						<h1 className="font-semibold text-lg">Component Docs</h1>
					</div>
					<p className="text-xs text-muted-foreground mt-1">Registry & Usage Guide</p>
				</div>
				<nav className="flex-1 p-3 space-y-4">
					<div>
						<p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
							Component Layers
						</p>
						<div className="space-y-1">
							{componentRegistry.map((layer) => {
								const Icon = layerIcons[layer.layer] ?? ComponentIcon
								return (
									<Link
										key={layer.layer}
										to="/docs/$layer"
										params={{ layer: layer.layer }}
										className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
									>
										<Icon className="size-4 shrink-0" />
										<span>{layer.title}</span>
										<span className="ml-auto text-xs text-muted-foreground">
											{layer.components.length}
										</span>
									</Link>
								)
							})}
						</div>
					</div>

					<div>
						<p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
							Examples
						</p>
						<div className="space-y-1">
							<Link
								to="/examples/page-layouts"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<LayoutDashboardIcon className="size-4 shrink-0" />
								<span>Page Layouts</span>
							</Link>
							<Link
								to="/examples/data-table"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<TableIcon className="size-4 shrink-0" />
								<span>Data Table</span>
							</Link>
							<Link
								to="/examples/form"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<FileTextIcon className="size-4 shrink-0" />
								<span>Form</span>
							</Link>
							<Link
								to="/examples/dialog-form"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<FileTextIcon className="size-4 shrink-0" />
								<span>Dialog Form</span>
							</Link>
							<Link
								to="/examples/dashboard"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<LayoutDashboardIcon className="size-4 shrink-0" />
								<span>Dashboard</span>
							</Link>
							<Link
								to="/examples/layouts"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<LayoutDashboardIcon className="size-4 shrink-0" />
								<span>Layouts</span>
							</Link>
							<Link
								to="/examples/search"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<FileTextIcon className="size-4 shrink-0" />
								<span>Search</span>
							</Link>
							<Link
								to="/examples/complex-form"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<FileTextIcon className="size-4 shrink-0" />
								<span>Complex Form</span>
							</Link>
							<Link
								to="/examples/charts"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<FileTextIcon className="size-4 shrink-0" />
								<span>Charts</span>
							</Link>
							<Link
								to="/examples/detail"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<FileTextIcon className="size-4 shrink-0" />
								<span>Detail</span>
							</Link>
							<Link
								to="/examples/details"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<FileTextIcon className="size-4 shrink-0" />
								<span>Details</span>
							</Link>
							<Link
								to="/examples/page-new"
								className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-accent-foreground [&.active]:font-medium"
							>
								<FileTextIcon className="size-4 shrink-0" />
								<span>Page New</span>
							</Link>
						</div>
					</div>
				</nav>
				<div className="p-4 border-t">
					<p className="text-[11px] text-muted-foreground leading-relaxed">
						<span className="font-medium">Readonly layers</span> (ui, reui) are managed by external
						registries and excluded from this docs.
					</p>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-y-auto">
				<Outlet />
			</main>
		</div>
	)
}
