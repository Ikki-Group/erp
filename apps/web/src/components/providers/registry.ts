import type { ComponentRegistry } from '../registry'

/**
 * Providers Registry
 * ===================
 * Global application context providers and wrappers.
 *
 * AI: These are app-level providers mounted near the root of the component tree.
 *     Do not create new providers without adding them to this registry.
 */
export const providersRegistry: ComponentRegistry = {
  layer: 'providers',
  title: 'Providers',
  description: 'Global application context providers for theming, feature flags, and cross-cutting concerns.',
  readonly: false,
  components: [
    {
      name: 'ThemeSwitcher / ThemeListener',
      file: './theme',
      description: 'Theme toggle button (light/dark/system) and listener that syncs theme changes to meta tags.',
      usage: '`<ThemeSwitcher />` renders a dropdown to switch themes. `<ThemeListener />` must be placed in the app root to sync meta-theme-color.',
      importPath: '@/components/providers/theme',
      tags: ['theme', 'dark-mode', 'light-mode', 'toggle', 'system'],
      exports: ['ThemeSwitcher', 'ThemeListener'],
    },
  ],
}
