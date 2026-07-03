#!/usr/bin/env bun
/**
 * Preview generation output without writing files
 * Used to review generated code before applying
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { parseServerContract } from './lib/contract-parser'

const PROJECT_ROOT = '/Users/rizqynugroho9/workspace/ikki/erp'
const SERVER_MODULES = join(PROJECT_ROOT, 'apps/server/src/modules')

// Re-export the generation functions from main script
import { generateDtoFile, generateApiFile, toPascalCase } from './generate-web-from-server'

const moduleName = process.argv[2] || 'location'
const serverContractPath = join(SERVER_MODULES, moduleName, `${moduleName}.contract.ts`)

try {
	const contractContent = readFileSync(serverContractPath, 'utf-8')
	const contract = parseServerContract(contractContent, moduleName)

	console.log(`\n${'='.repeat(80)}`)
	console.log(`PREVIEW: ${moduleName}.dto.ts`)
	console.log('='.repeat(80))
	console.log(generateDtoFile(contract, moduleName))

	console.log(`\n${'='.repeat(80)}`)
	console.log(`PREVIEW: ${moduleName}.api.ts`)
	console.log('='.repeat(80))
	console.log(generateApiFile(contract, moduleName))
} catch (error) {
	console.error('Error:', error)
	process.exit(1)
}
