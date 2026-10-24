import type { ActorId } from '@/shared/types/utils.ts'

export function stampCreate(actorId: ActorId) {
	return {
		createdBy: actorId,
		updatedBy: actorId,
		createdAt: new Date(),
		updatedAt: new Date(),
	}
}

export function stampUpdate(actorId: ActorId) {
	return {
		updatedBy: actorId,
		updatedAt: new Date(),
	}
}
