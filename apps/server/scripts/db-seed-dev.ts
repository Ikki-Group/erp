import { createModules } from '@/modules/_registry'

async function main() {
	const m = createModules()

	console.log('🌱 Starting core database seed...')
	await m.tool.seed.seed()
	console.log('✅ Core seed completed.')

	console.log('🌱 Starting development mock data seed...')
	await m.tool.seed.seedDev()
	console.log('✅ Development seed completed.')
}

// oxlint-disable-next-line unicorn/prefer-top-level-await typescript/no-floating-promises
await main()
