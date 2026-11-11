import { useState } from 'react'

import { useLocationContext } from '@/providers/location-provider.tsx'

export interface EditorLocation {
	id: number
	name: string
}

export interface EditorLocationScope {
	/** Session location; null until a create session first selects a location. */
	location: EditorLocation | null
	isCurrent: boolean
	/** False when access to the pinned location is no longer available. */
	canRestore: boolean
	restore: () => void
}

export interface PinnedEditorLocationScope extends EditorLocationScope {
	location: EditorLocation
}

/**
 * Existing records pin their own location ID; create sessions pin the first selected location.
 * Mount after record detail resolves and key by record ID. Header changes never retarget a draft.
 */
export function useEditorLocationScope(fixedLocationId?: number): EditorLocationScope {
	const { activeLocation, locations, switchLocation } = useLocationContext()
	const [pinnedId, setPinnedId] = useState(() => fixedLocationId ?? activeLocation?.id ?? null)
	if (pinnedId === null && activeLocation !== null) setPinnedId(activeLocation.id)
	const allowedLocation = locations.find((location) => location.id === pinnedId)

	return {
		location:
			pinnedId === null ? null : (allowedLocation ?? { id: pinnedId, name: `Lokasi #${pinnedId}` }),
		isCurrent: pinnedId !== null && activeLocation?.id === pinnedId,
		canRestore: allowedLocation !== undefined,
		restore: () => {
			if (allowedLocation) switchLocation(allowedLocation.id)
		},
	}
}
