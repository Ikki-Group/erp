import { BoxIcon, InboxIcon } from 'lucide-react'

import { BadgeDot } from './data-display/badge-dot'
import { EmptyState } from './feedback/empty-state'
import { LoadingPage } from './feedback/loading-page'
import { ActiveStatusBadge, StatusBadge, activeStatusMap } from './data-display/status-badge'
import { IkkiLogo } from './brand/logo'
import type { ComponentRegistryEntry } from '../registry'

/**
 * Preview renderers for blocks components.
 * Keyed by component `name` from the registry.
 */
export const blocksPreviews: Record<string, ComponentRegistryEntry['preview']> = {
  StatusBadge: () => (
    <div className="flex items-center gap-2 flex-wrap">
      <ActiveStatusBadge status="active" />
      <ActiveStatusBadge status="inactive" />
      <StatusBadge status="active" statusMap={activeStatusMap} />
    </div>
  ),

  BadgeDot: () => (
    <div className="flex items-center gap-3">
      <BadgeDot color="green" />
      <BadgeDot color="red" />
      <BadgeDot color="yellow" />
    </div>
  ),

  EmptyState: () => (
    <EmptyState
      icon={InboxIcon}
      title="Belum ada data"
      description="Mulai dengan menambahkan item baru."
      compact
    />
  ),

  LoadingPage: () => (
    <div className="h-24 relative">
      <LoadingPage />
    </div>
  ),

  IkkiLogo: () => (
    <div className="flex items-center gap-3">
      <IkkiLogo />
      <span className="text-sm text-muted-foreground">Official Logo</span>
    </div>
  ),
}
