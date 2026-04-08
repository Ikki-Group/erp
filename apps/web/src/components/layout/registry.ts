import type { ComponentRegistry } from '../registry'

export const layoutRegistry: ComponentRegistry = {
  layer: 'layout',
  title: 'Layout',
  description:
    'Structural containers for pages, sections, and navigation. Expert-level primitives using CVA and Base UI patterns.',
  readonly: false,
  components: [
    {
      name: 'AppLayout',
      file: './app-layout',
      description:
        'Root application shell with sidebar navigation, header, and main content area. Expertly organized with extracted brand and menu sub-components.',
      usage:
        'Used once in the `/_app` route as the top-level authenticated layout. Supports smooth entry animations and premium backdrop filters.',
      importPath: '@/components/layout/app-layout',
      tags: ['shell', 'sidebar', 'navigation', 'root-layout'],
      exports: ['AppLayout'],
    },
    {
      name: 'Page',
      file: './page',
      description:
        'High-performance page container with CVA-managed sizing and smooth entry animations. Pattern-aligned with Base UI render prop.',
      usage:
        'Wrap every route-level page in `<Page>`. Use `Page.BlockHeader` for premium headers. Supports `render` prop for component composition.',
      importPath: '@/components/layout/page',
      tags: ['page', 'container', 'max-width', 'header', 'actions'],
      exports: ['Page'],
    },
    {
      name: 'FormLayout',
      file: './form-layout',
      description: 'Layout system for data entry. Optimized with CVA-driven FormGrid and sticky action bars.',
      usage:
        'Use inside `<Page>` for forms. `FormLayout.Grid` handles responsive columns (1-3). `FormLayout.CardSection` provides premium visual grouping.',
      importPath: '@/components/layout/form-layout',
      tags: ['form', 'grid', 'section', 'card', 'create', 'edit'],
      exports: ['FormLayout'],
    },
    {
      name: 'Breadcrumbs',
      file: './breadcrumbs',
      description: 'Auto-generated navigation trail with refined typography and smooth transitions.',
      usage: 'Integrated into AppLayout header. Automatically resolves menu titles and hierarchy from app-menu config.',
      importPath: '@/components/layout/breadcrumbs',
      tags: ['breadcrumb', 'navigation', 'auto'],
      exports: ['Breadcrumbs'],
    },
    {
      name: 'PageHeader',
      file: './page-header',
      description: 'Standalone PageHeader with support for breadcrumbs, titles, and actions. Uses Base UI pattern.',
      usage: 'Used for standalone headers or inside nested containers. Supports `render` prop for custom wrappers.',
      importPath: '@/components/layout/page-header',
      tags: ['header', 'title', 'standalone'],
      exports: ['PageHeader'],
    },
    {
      name: 'Primitives',
      file: './primitives',
      description:
        'Low-level building blocks: Grid, Stack, Inline, Section. Optimized with CVA and Base UI render pattern.',
      usage:
        'The foundation for all layout components. Use for custom structures that require precise control over gaps, alignment, and composition.',
      importPath: '@/components/layout/primitives',
      tags: ['grid', 'stack', 'inline', 'section', 'primitives'],
      exports: ['Section', 'SectionHeader', 'Grid', 'Stack', 'Inline'],
    },
  ],
}
