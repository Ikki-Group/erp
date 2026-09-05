import type { BuiltModule, ModuleContext, ModuleDescriptor } from './registry.ts'

export function composeModules(
	descriptors: ModuleDescriptor[],
	ctx: ModuleContext,
): Map<string, BuiltModule> {
	const byName = new Map(descriptors.map((descriptor) => [descriptor.name, descriptor]))
	const built = new Map<string, BuiltModule>()
	const visiting = new Set<string>()

	function build(name: string): BuiltModule {
		const existing = built.get(name)
		if (existing) return existing
		if (visiting.has(name)) throw new Error(`Module dependency cycle at "${name}"`)

		const descriptor = byName.get(name)
		if (!descriptor) throw new Error(`Unknown module dependency "${name}"`)

		visiting.add(name)
		const deps: Record<string, BuiltModule> = {}
		for (const dependency of descriptor.dependsOn) {
			const dependencyDescriptor = byName.get(dependency)
			if (dependencyDescriptor && dependencyDescriptor.layer > descriptor.layer) {
				throw new Error(
					`Upward dependency: "${name}" (L${descriptor.layer}) → "${dependency}" (L${dependencyDescriptor.layer})`,
				)
			}
			deps[dependency] = build(dependency)
		}

		const module = descriptor.create(ctx, deps)
		built.set(name, module)
		visiting.delete(name)
		return module
	}

	for (const descriptor of descriptors) build(descriptor.name)
	return built
}
