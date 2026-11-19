import type { ReactNode } from 'react'

import { MapPinIcon } from 'lucide-react'

import { EmptyState } from './empty-state'
import { PageShell } from './page-shell'

export interface LocationRequiredPageProps {
	title: string
	description?: string
	message?: string
	icon?: ReactNode
	children?: ReactNode
}

/** Guards location-dependent pages while keeping their page chrome consistent. */
export function LocationRequiredPage({
	title,
	description,
	message = 'Pilih lokasi aktif untuk melanjutkan.',
	icon,
	children,
}: LocationRequiredPageProps) {
	return (
		<PageShell title={title} description={description}>
			{children ?? (
				<EmptyState title="Pilih lokasi" description={message} icon={icon ?? <MapPinIcon />} />
			)}
		</PageShell>
	)
}
