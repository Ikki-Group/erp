import { Link, createFileRoute } from '@tanstack/react-router'
import { BookOpenIcon, ComponentIcon, LayersIcon, LayoutDashboardIcon, PaletteIcon, TableIcon } from 'lucide-react'

import { componentRegistry } from '@/components/registry'

export const Route = createFileRoute('/_docs/docs/')({
  component: DocsIndex,
})

const layerIcons: Record<string, typeof ComponentIcon> = {
  layout: LayoutDashboardIcon,
  form: PaletteIcon,
  'data-table': TableIcon,
  blocks: LayersIcon,
  providers: ComponentIcon,
}

function DocsIndex() {
  const totalComponents = componentRegistry.reduce((sum, layer) => sum + layer.components.length, 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Component Registry</h1>
        <p className="text-muted-foreground text-lg">
          {totalComponents} components across {componentRegistry.length} layers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {componentRegistry.map((layer) => {
          const Icon = layerIcons[layer.layer] ?? ComponentIcon
          return (
            <Link
              key={layer.layer}
              to="/docs/$layer"
              params={{ layer: layer.layer }}
              className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-base group-hover:text-primary transition-colors">{layer.title}</h2>
                  <p className="text-xs text-muted-foreground">{layer.components.length} components</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{layer.description}</p>
              {layer.readonly && (
                <span className="absolute top-3 right-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Readonly
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="mt-10 rounded-lg border border-dashed p-6 text-center">
        <BookOpenIcon className="size-8 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-medium text-sm mb-1">Readonly Registries</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">ui/</code> (Shadcn) and{' '}
          <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">reui/</code> (Internal) are managed by external registries and not listed here.
        </p>
      </div>
    </div>
  )
}
