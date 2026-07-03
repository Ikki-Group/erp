#!/usr/bin/env bun
/**
 * Generator v2: Simple Copy-Paste Approach
 *
 * Straightforward: parse server contract, copy schemas, change import
 * No complex transformations - keep it simple.
 *
 * Usage:
 *   bun scripts/generate-web-from-server-v2.ts location
 *   bun scripts/generate-web-from-server-v2.ts location --dry-run
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const PROJECT_ROOT = '/Users/rizqynugroho9/workspace/ikki/erp'
const SERVER_MODULES = join(PROJECT_ROOT, 'apps/server/src/modules')
const WEB_FEATURES = join(PROJECT_ROOT, 'apps/web/src/features')

async function main() {
	const args = process.argv.slice(2)
	const moduleName = args[0]

	if (!moduleName) {
		console.error('❌ Usage: bun generate-web-from-server-v2.ts <module-name> [--dry-run]')
		console.error('Example: bun generate-web-from-server-v2.ts location')
		process.exit(1)
	}

	const dryRun = args.includes('--dry-run')

	try {
		await generate(moduleName, dryRun)
		console.log('\n✅ Generation completed successfully!\n')
	} catch (error) {
		console.error('\n❌ Error:', error)
		process.exit(1)
	}
}

async function generate(moduleName: string, dryRun: boolean) {
	console.log(`\n📦 Generating web DTO for module: ${moduleName}`)
	console.log(`   Mode: ${dryRun ? '👀 DRY-RUN' : '✍️  WRITE'}`)

	// 1. Read server contract
	const serverContractPath = join(SERVER_MODULES, moduleName, `${moduleName}.contract.ts`)
	if (!existsSync(serverContractPath)) {
		throw new Error(`Server contract not found: ${serverContractPath}`)
	}

	console.log(`\n📖 Reading server contract...`)
	const contractContent = readFileSync(serverContractPath, 'utf-8')

	// 2. Transform: Replace import path
	const webContent = transformContractToWeb(contractContent)

	// 3. Write to web
	const dtoDirPath = join(WEB_FEATURES, moduleName, 'dto')
	const dtoFilePath = join(dtoDirPath, `${moduleName}.dto.ts`)

	console.log(`\n🔨 Generating web DTO...`)

	if (!dryRun) {
		mkdirSync(dtoDirPath, { recursive: true })
		writeFileSync(dtoFilePath, webContent)
		console.log(`   ✓ Created: apps/web/src/features/${moduleName}/dto/${moduleName}.dto.ts`)

		// Update index
		const indexPath = join(dtoDirPath, 'index.ts')
		updateIndexFile(indexPath, `${moduleName}.dto`)
		console.log(`   ✓ Updated: apps/web/src/features/${moduleName}/dto/index.ts`)
	} else {
		console.log(
			`   [DRY-RUN] Would create: apps/web/src/features/${moduleName}/dto/${moduleName}.dto.ts`,
		)
		console.log(`\n📋 Preview (first 50 lines):`)
		console.log('---')
		console.log(webContent.split('\n').slice(0, 50).join('\n'))
		console.log('---')
	}
}

function transformContractToWeb(contractContent: string): string {
	let content = contractContent

	// Replace import path from @/shared/schema to @/lib/validation
	content = content.replace(/from\s+['"]@\/shared\/schema['"]/g, "from '@/lib/validation'")

	return content
}

function updateIndexFile(filePath: string, exportName: string): void {
	const dirPath = filePath.substring(0, filePath.lastIndexOf('/'))
	mkdirSync(dirPath, { recursive: true })

	let content = ''
	if (existsSync(filePath)) {
		content = readFileSync(filePath, 'utf-8')
	}

	const exportLine = `export * from './${exportName}'`
	if (!content.includes(exportLine)) {
		if (content.trim()) content += '\n'
		content += exportLine + '\n'
		writeFileSync(filePath, content)
	}
}

main().catch(console.error)
