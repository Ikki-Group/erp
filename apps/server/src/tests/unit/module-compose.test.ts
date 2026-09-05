import { composeModules } from '@/shared/module/compose.ts'
import type { ModuleContext, ModuleDescriptor } from '@/shared/module/registry.ts'

import { describe, expect, test } from 'bun:test'

// Composer tests do not use infrastructure; the context is intentionally opaque.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const ctx = {} as ModuleContext

function descriptor(
	name: string,
	layer: ModuleDescriptor['layer'],
	dependsOn: string[],
	onCreate: () => void,
): ModuleDescriptor {
	return {
		name,
		layer,
		dependsOn,
		create() {
			onCreate()
			return {}
		},
	}
}

describe('composeModules', () => {
	test('returns an empty registry when no descriptors are supplied', () => {
		expect(composeModules([], ctx)).toEqual(new Map())
	})

	test('builds dependencies first and memoizes shared dependencies', () => {
		const order: string[] = []
		const modules = composeModules(
			[
				descriptor('root', 2, ['shared', 'shared'], () => order.push('root')),
				descriptor('shared', 1, [], () => order.push('shared')),
			],
			ctx,
		)

		expect(order).toEqual(['shared', 'root'])
		expect(modules.size).toBe(2)
	})

	test('rejects dependency cycles', () => {
		const descriptors = [
			descriptor('first', 0, ['second'], () => {}),
			descriptor('second', 0, ['first'], () => {}),
		]

		expect(() => composeModules(descriptors, ctx)).toThrow('Module dependency cycle at "first"')
	})

	test('rejects upward dependencies', () => {
		const descriptors = [
			descriptor('core', 0, ['operations'], () => {}),
			descriptor('operations', 2, [], () => {}),
		]

		expect(() => composeModules(descriptors, ctx)).toThrow(
			'Upward dependency: "core" (L0) → "operations" (L2)',
		)
	})
})
