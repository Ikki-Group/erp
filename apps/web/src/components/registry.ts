/**
 * Component Registry Type System
 * ================================
 * Each Level 1 component folder exports a `registry` array describing its components.
 * This prevents duplication and serves as a single source of truth for both
 * AI assistants and developers.
 *
 * AI INSTRUCTIONS:
 * - Before creating a new component, query this registry to check if one already exists.
 * - When adding a new component, you MUST also add its registry entry.
 * - The `tags` field helps with semantic search and discovery.
 */

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

export interface ComponentRegistryEntry {
	/** Unique component name (PascalCase) */
	name: string
	/** File path relative to the layer folder, e.g. `./status-badge` */
	file: string
	/** One-line description of what this component does */
	description: string
	/** When and why to use this component */
	usage: string
	/** Import path alias, e.g. `@/components/blocks/data-display/status-badge` */
	importPath: string
	/** Semantic tags for AI search and categorization */
	tags: string[]
	/** Named exports available from this file */
	exports: string[]
	/** Optional preview renderer — loaded lazily in docs UI */
	preview?: () => React.ReactNode
}

export interface ComponentRegistry {
	/** Layer 1 folder name */
	layer: string
	/** Human-readable layer title */
	title: string
	/** What this layer is responsible for */
	description: string
	/** Whether this layer is readonly (managed by external registry like shadcn) */
	readonly: boolean
	/** All components in this layer */
	components: ComponentRegistryEntry[]
}

// ---------------------------------------------------------------------------
//  Central Registry Aggregator
// ---------------------------------------------------------------------------

import { blocksRegistry } from './blocks/_registry'
import { dataTableRegistry } from './data-table/registry'
import { formRegistry } from './form/registry'
import { layoutRegistry } from './layout/registry'
import { providersRegistry } from './providers/registry'

/**
 * The complete component registry for `apps/web`.
 * Readonly registries (`ui`, `reui`) are excluded — they are managed externally.
 */
export const componentRegistry: ComponentRegistry[] = [
	layoutRegistry,
	formRegistry,
	dataTableRegistry,
	blocksRegistry,
	providersRegistry,
]
