import type { ComponentRegistry } from '../registry'

/**
 * Layout Registry
 * ================
 * Structural containers that define the visual skeleton of pages.
 * These components handle page structure, spacing, headers, and navigation chrome.
 *
 * AI: Use layout components to wrap page content. Never build ad-hoc page wrappers.
 */
export const layoutRegistry: ComponentRegistry = {
  layer: 'layout',
  title: 'Layout',
  description: 'Structural containers for pages, sections, and navigation. Defines the visual skeleton of the application.',
  readonly: false,
  components: [
    {
      name: 'AppLayout',
      file: './app-layout',
      description: 'Root application shell with sidebar navigation, header, and main content area.',
      usage: 'Used once in the `/_app` route as the top-level authenticated layout. Do not nest or reuse elsewhere.',
      importPath: '@/components/layout/app-layout',
      tags: ['shell', 'sidebar', 'navigation', 'root-layout'],
      exports: ['AppLayout'],
    },
    {
      name: 'Page',
      file: './page',
      description: 'Page container with max-width constraint and consistent padding. Includes compound sub-components for headers, titles, actions.',
      usage: 'Wrap every route-level page in `<Page>`. Use `Page.BlockHeader` for standard page headers with title, description, back button, and actions.',
      importPath: '@/components/layout/page',
      tags: ['page', 'container', 'max-width', 'header', 'actions'],
      exports: ['Page'],
    },
    {
      name: 'FormLayout',
      file: './form-layout',
      description: 'Layout system for form pages. Provides grid, sections, card sections, and action bar sub-components.',
      usage: 'Use inside `<Page>` when building create/edit forms. `FormLayout.Grid` handles responsive column layouts. `FormLayout.CardSection` wraps form groups in cards with titles.',
      importPath: '@/components/layout/form-layout',
      tags: ['form', 'grid', 'section', 'card', 'create', 'edit'],
      exports: ['FormLayout'],
    },
    {
      name: 'Breadcrumbs',
      file: './breadcrumbs',
      description: 'Auto-generated breadcrumb trail based on TanStack Router context.',
      usage: 'Already integrated inside AppLayout header. No manual usage needed unless building a custom layout.',
      importPath: '@/components/layout/breadcrumbs',
      tags: ['breadcrumb', 'navigation', 'auto'],
      exports: ['Breadcrumbs'],
    },
    {
      name: 'PageHeader',
      file: './page-header',
      description: 'Standalone page header with title, description, and action slot.',
      usage: 'Use when you need a standalone header outside the `Page.BlockHeader` compound pattern, e.g. inside modals or side panels.',
      importPath: '@/components/layout/page-header',
      tags: ['header', 'title', 'standalone'],
      exports: ['PageHeader'],
    },
    {
      name: 'Primitives',
      file: './primitives',
      description: 'Low-level layout primitives: Section, SectionHeader, SectionContent for building custom layouts.',
      usage: 'Use for building non-standard page layouts that need consistent spacing but no page-level constraints.',
      importPath: '@/components/layout/primitives',
      tags: ['section', 'primitives', 'low-level', 'custom-layout'],
      exports: ['Section', 'SectionHeader', 'SectionContent'],
    },
  ],
}
