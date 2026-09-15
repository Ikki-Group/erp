import { cache } from '@/infra/cache/cache.memory.ts'

const AUTH_NAMESPACE = 'auth'

function accessCacheKey(userId: number): string {
	return `access:${userId}`
}

function authAccessCacheKey(userId: number): string {
	return `${AUTH_NAMESPACE}:${accessCacheKey(userId)}`
}

export async function getAuthAccessMap<T extends { roleIds: number[] }>(
	userId: number,
	factory: () => Promise<T>,
	ttlSeconds?: number,
): Promise<T> {
	const value = await cache.getOrSet(AUTH_NAMESPACE, accessCacheKey(userId), factory, ttlSeconds)
	await cache.tagKeys(
		[authAccessCacheKey(userId)],
		[...new Set(value.roleIds)].map((roleId) => `role:${roleId}`),
	)
	return value
}

export async function invalidateAuthCache(userId: number): Promise<void> {
	await cache.invalidateKeys([authAccessCacheKey(userId)])
}

export async function invalidateAuthCacheForRole(roleId: number): Promise<void> {
	await cache.invalidateTag(`role:${roleId}`)
}
