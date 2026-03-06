/**
 * Creates a lookup Map from an array, keyed by a selected property.
 *
 * By default, the key is stringified (`.toString()`) so numeric keys
 * work seamlessly with string-based lookups.
 *
 * @example
 * const roles = await roleSvc.find()
 * const roleMap = toLookupMap(roles, 'id')
 * roleMap.get(someId.toString()) // => RoleDto | undefined
 *
 * @example Custom key extractor
 * const roleByCode = toLookupMap(roles, (r) => r.code)
 * roleByCode.get('SUPERADMIN') // => RoleDto | undefined
 */
export function toLookupMap<T>(items: T[], keyOrFn: keyof T | ((item: T) => string)): Map<string, T> {
  const fn = typeof keyOrFn === 'function' ? keyOrFn : (item: T) => String(item[keyOrFn])
  return new Map(items.map((item) => [fn(item), item]))
}

/**
 * Creates a grouped Map from an array, keyed by a selected property.
 * Each key maps to an array of matching items.
 *
 * @example
 * const usersByRole = toGroupMap(users, (u) => u.roleId.toString())
 * usersByRole.get(roleId) // => UserDto[] | undefined
 */
export function toGroupMap<T>(items: T[], keyOrFn: keyof T | ((item: T) => string)): Map<string, T[]> {
  const fn = typeof keyOrFn === 'function' ? keyOrFn : (item: T) => String(item[keyOrFn])
  const map = new Map<string, T[]>()

  for (const item of items) {
    const k = fn(item)
    const group = map.get(k)
    if (group) group.push(item)
    else map.set(k, [item])
  }

  return map
}
