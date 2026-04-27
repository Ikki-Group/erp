import { createModules } from '@/modules/_registry'

async function main() {
	const m = createModules()

	await m.tool.seed.seed()
}

// oxlint-disable-next-line unicorn/prefer-top-level-await typescript/no-floating-promises
main()
