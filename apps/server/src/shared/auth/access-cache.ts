import { cachePort as cache } from '@/infra/cache/index.ts'

const AUTH_NAMESPACE = 'auth'

function accessCacheKey(userId: number): string {
	return `access:${userId}`
}

function authAccessCacheKey(userId: number): string {
	return `${AUTH_NAMESPACE}:${accessCacheKey(userId)}`
}

const roleTag = (roleId: number) => `role:${roleId}`

export async function getAuthAccessMap<T extends { roleIds: number[] }>(
	userId: number,
	factory: () => Promise<T>,
	ttlSeconds?: number,
): Promise<T> {
	return cache.getOrSet(
		AUTH_NAMESPACE,
		accessCacheKey(userId),
		async (ctx) => {
			const value = await factory()
			ctx.setTags([...new Set(value.roleIds)].map(roleTag))
			return value
		},
		ttlSeconds,
	)
}

export async function invalidateAuthCache(userId: number): Promise<void> {
	await cache.invalidateKeys([authAccessCacheKey(userId)])
}

export async function invalidateAuthCacheForRole(roleId: number): Promise<void> {
	await cache.invalidateTag(roleTag(roleId))
}
