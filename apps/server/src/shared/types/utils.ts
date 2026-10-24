export interface EntityRef {
	id: number
}

export type ActorId = number

export type WithId<T> = T & { id: number }
