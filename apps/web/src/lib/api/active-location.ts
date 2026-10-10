import { useSyncExternalStore } from 'react'

/**
 * The active location — the single source of truth for both React (via
 * `useActiveLocationId`) and framework code (request headers, query keys via
 * `getActiveLocationId`). A plain module store, so there is no accessor to
 * wire and nothing can point at a stale provider instance after re-login.
 *
 * `null` is the consolidated (all-locations) view.
 */
const STORAGE_KEY = 'ikki-active-location-id'

const listeners = new Set<() => void>()

// Storage may be missing (SSR/tests) or throw (privacy modes); the in-memory value still works.
const storage = {
	get: () => {
		try {
			return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null
		} catch {
			return null
		}
	},
	set: (value: string | null) => {
		try {
			if (value === null) globalThis.localStorage?.removeItem(STORAGE_KEY)
			else globalThis.localStorage?.setItem(STORAGE_KEY, value)
		} catch {
			// ignore
		}
	},
}

function read(): number | null {
	const raw = storage.get()
	const id = raw === null ? Number.NaN : Number(raw)
	return Number.isInteger(id) && id > 0 ? id : null
}

let current = read()

export function getActiveLocationId(): number | null {
	return current
}

export function setActiveLocationId(id: number | null): void {
	if (id === current) return
	current = id
	storage.set(id === null ? null : String(id))
	for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

export function useActiveLocationId(): number | null {
	return useSyncExternalStore(subscribe, getActiveLocationId)
}
