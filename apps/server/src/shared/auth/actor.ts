import type { AuthContext } from './permission.ts'

export interface Actor {
	id: number
	name: string
	locationId: number | null
}

export function actorOf(auth: AuthContext): Actor {
	return { id: auth.userId, name: auth.userName, locationId: auth.locationId }
}
