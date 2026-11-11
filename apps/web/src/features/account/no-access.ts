export interface AccessSnapshot {
	isOwner: boolean
	locations: readonly unknown[]
	globalPermissions: readonly string[]
}

/** A signed-in user who is not an owner and holds neither a location nor a global grant can use nothing in the app. */
export function hasNoAccess({ isOwner, locations, globalPermissions }: AccessSnapshot): boolean {
	return !isOwner && locations.length === 0 && globalPermissions.length === 0
}
