import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { ArrowLeftIcon, BookOpenIcon, ComponentIcon, LayersIcon, LayoutDashboardIcon, TableIcon, PaletteIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { componentRegistry } from '@/components/registry'

export const Route = createFileRoute('/_docs')({
  component: DocsLayout,
})

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
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
        <nav className="flex-1 p-3 space-y-1">
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
                <span className="ml-auto text-xs text-muted-foreground">{layer.components.length}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-medium">Readonly layers</span> (ui, reui) are managed by external registries and excluded from this docs.
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
