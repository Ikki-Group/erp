#!/usr/bin/env bun
/**
 * Generator: Server Contract → Web DTO/API
 *
 * Generates web layer files from server contract:
 * - apps/web/src/features/[module]/dto/[module].dto.ts
 * - apps/web/src/features/[module]/api/[module].api.ts
 *
 * Usage:
 *   bun scripts/generate-web-from-server.ts location
 *   bun scripts/generate-web-from-server.ts location --dry-run
 *   bun scripts/generate-web-from-server.ts location --force
 *
 * What it does:
 * 1. Parses server contract (enums, schemas, fields)
 * 2. Converts server patterns to web patterns (Enum→Dto, patterns)
 * 3. Generates web DTO with extracted fields
 * 4. Generates web API layer with CRUD endpoints
 * 5. Updates index files for exports
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { parseServerContract, type ParsedContract } from './lib/contract-parser'

const PROJECT_ROOT = '/Users/rizqynugroho9/workspace/ikki/erp'
const SERVER_MODULES = join(PROJECT_ROOT, 'apps/server/src/modules')
const WEB_FEATURES = join(PROJECT_ROOT, 'apps/web/src/features')

interface GeneratorOptions {
  moduleName: string
  dryRun: boolean
  force: boolean
}

async function main() {
  const args = process.argv.slice(2)
  const moduleName = args[0]

  if (!moduleName) {
    console.error('❌ Usage: bun generate-web-from-server.ts <module-name> [--dry-run] [--force]')
    console.error('Example: bun generate-web-from-server.ts location')
    process.exit(1)
  }

  const options: GeneratorOptions = {
    moduleName,
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  }

  try {
    await generateWebLayer(options)
    console.log('\n✅ Generation completed successfully!\n')
  } catch (error) {
    console.error('\n❌ Generation failed:', error)
    process.exit(1)
  }
}

async function generateWebLayer(options: GeneratorOptions) {
  const { moduleName, dryRun, force } = options

  console.log(`\n📦 Generating web layer for module: ${moduleName}`)
  console.log(`   Mode: ${dryRun ? '👀 DRY-RUN (preview only)' : '✍️  WRITE'}`)

  // 1. Parse server contract
  const serverContractPath = join(SERVER_MODULES, moduleName, `${moduleName}.contract.ts`)
  if (!existsSync(serverContractPath)) {
    throw new Error(`Server contract not found: ${serverContractPath}`)
  }

  console.log(`\n📖 Parsing server contract...`)
  const contractContent = readFileSync(serverContractPath, 'utf-8')
  const contract = parseServerContract(contractContent, moduleName)

  console.log(`   • Enums found: ${contract.enums.length}`)
  console.log(`   • Schemas found: ${contract.schemas.size}`)

  // 2. Generate web DTO
  console.log(`\n🔨 Generating web DTO...`)
  const dtoContent = generateDtoFile(contract, moduleName)
  const dtoDirPath = join(WEB_FEATURES, moduleName, 'dto')
  const dtoFilePath = join(dtoDirPath, `${moduleName}.dto.ts`)

  if (!dryRun) {
    mkdirSync(dtoDirPath, { recursive: true })
    writeFileSync(dtoFilePath, dtoContent)
    console.log(`   ✓ Created: apps/web/src/features/${moduleName}/dto/${moduleName}.dto.ts`)
  } else {
    console.log(`   [DRY-RUN] Would create: apps/web/src/features/${moduleName}/dto/${moduleName}.dto.ts`)
  }

  // 3. Generate web API
  console.log(`\n🔨 Generating web API layer...`)
  const apiContent = generateApiFile(contract, moduleName)
  const apiDirPath = join(WEB_FEATURES, moduleName, 'api')
  const apiFilePath = join(apiDirPath, `${moduleName}.api.ts`)

  if (!dryRun) {
    mkdirSync(apiDirPath, { recursive: true })
    writeFileSync(apiFilePath, apiContent)
    console.log(`   ✓ Created: apps/web/src/features/${moduleName}/api/${moduleName}.api.ts`)
  } else {
    console.log(`   [DRY-RUN] Would create: apps/web/src/features/${moduleName}/api/${moduleName}.api.ts`)
  }

  // 4. Update index files
  const dtoIndexPath = join(dtoDirPath, 'index.ts')
  const apiIndexPath = join(apiDirPath, 'index.ts')

  if (!dryRun) {
    updateIndexFile(dtoIndexPath, `${moduleName}.dto`)
    updateIndexFile(apiIndexPath, `${moduleName}.api`)
    console.log(`   ✓ Updated index exports`)
  } else {
    console.log(`   [DRY-RUN] Would update index files`)
  }

  // Summary
  console.log(`\n📊 Generated:`)
  console.log(`   • DTO schemas: ${contract.schemas.size}`)
  console.log(`   • Enums: ${contract.enums.length}`)
  console.log(`   • API endpoints: 5 (list, detail, create, update, remove)`)
}


/* ============================================================================= */
/* CODE GENERATION: DTO */
/* ============================================================================= */

function generateDtoFile(contract: ParsedContract, moduleName: string): string {
  const pascalName = toPascalCase(moduleName)

  const imports = `import { z, zc, zp, zq } from '@ikki/api-contract/validation'\n\n`

  // Generate enums
  let enumsCode = ''
  if (contract.enums.length > 0) {
    enumsCode = contract.enums
      .map((e) => {
        const values = e.values.map((v) => `'${v}'`).join(', ')
        return `/** Types of operational ${moduleName}. */
export const ${e.typeName} = z.enum([${values}])
export type ${e.typeName} = z.infer<typeof ${e.typeName}>`
      })
      .join('\n\n')
  }

  // Get schemas from contract
  const schemas = Array.from(contract.schemas.values())

  // Find the primary mutation schema (usually has "Mutation" in name)
  // This represents the shared mutation fields
  const mutationSchema = schemas.find((s) => s.name.includes('Mutation'))

  const entitySchema = schemas.find((s) => s.isEntity && s.name.endsWith('Dto'))

  // Extract mutation fields (exclude id and audit fields)
  let mutationFields = ''
  if (mutationSchema) {
    mutationFields = mutationSchema.fields
      .map((f) => {
        // Skip audit and id fields
        if (
          f.name === 'id' ||
          f.name.includes('createdBy') ||
          f.name.includes('updatedBy') ||
          f.name.includes('createdAt') ||
          f.name.includes('updatedAt')
        )
          return null

        const nullable = f.isNullable ? '.nullable()' : ''
        const optional = f.isOptional ? '.optional()' : ''
        const type = mapServerTypeToWeb(f.type, contract)
        return `	${f.name}: ${type}${nullable}${optional},`
      })
      .filter(Boolean)
      .join('\n')
  }

  // Extract entity fields (for display DTO)
  let entityFields = ''
  if (entitySchema) {
    entityFields = entitySchema.fields
      .map((f) => {
        if (
          f.name === 'id' ||
          f.name.includes('createdBy') ||
          f.name.includes('updatedBy') ||
          f.name.includes('createdAt') ||
          f.name.includes('updatedAt')
        )
          return null // handled by spreads
        const nullable = f.isNullable ? '.nullable()' : ''
        const optional = f.isOptional ? '.optional()' : ''
        const type = mapServerTypeToWeb(f.type, contract)
        return `	${f.name}: ${type}${nullable}${optional},`
      })
      .filter(Boolean)
      .join('\n')
  }

  const dtoSchemas = `
export const ${pascalName}Dto = z.object({
	...zc.RecordId.shape,
${entityFields || '	// fields extracted from server contract'}
	...zc.AuditBasic.shape,
})
export type ${pascalName}Dto = z.infer<typeof ${pascalName}Dto>

export const ${pascalName}CreateDto = z.object({
${mutationFields || '	// mutation fields extracted from server contract (TODO: verify fields)'}
})
export type ${pascalName}CreateDto = z.infer<typeof ${pascalName}CreateDto>

export const ${pascalName}UpdateDto = z.object({
	...zc.RecordId.shape,
	...${pascalName}CreateDto.shape
})
export type ${pascalName}UpdateDto = z.infer<typeof ${pascalName}UpdateDto>

export const ${pascalName}FilterDto = z.object({
	q: zq.search,
	...zq.pagination.shape,
})
export type ${pascalName}FilterDto = z.infer<typeof ${pascalName}FilterDto>
`

  return imports + (enumsCode ? enumsCode + '\n\n' : '') + dtoSchemas
}

function mapServerTypeToWeb(serverType: string, contract: ParsedContract): string {
  // Map server type primitives to web validators
  const typeMap: Record<string, string> = {
    id: 'zc.RecordId',
    str: 'zp.str',
    strTrim: 'zc.strTrim',
    strNullable: 'zp.strNullable',
    strTrimNullable: 'zc.strTrimNullable',
    bool: 'zp.bool',
    int: 'zp.int',
    enum: 'z.enum',
    search: 'zq.search',
  }

  if (typeMap[serverType]) {
    return typeMap[serverType]
  }

  // Check if it's an enum that we're converting
  if (contract.typeMapping.has(serverType)) {
    return contract.typeMapping.get(serverType) || 'z.unknown()'
  }

  return 'z.unknown() // TODO: map type'
}

/* ============================================================================= */
/* CODE GENERATION: API */
/* ============================================================================= */

function generateApiFile(contract: ParsedContract, moduleName: string): string {
  const pascalName = toPascalCase(moduleName)
  const camelName = moduleName.charAt(0).toLowerCase() + moduleName.slice(1)

  const imports = `import {
	createPaginatedResponseSchema,
	createSuccessResponseSchema,
	zc,
	zq,
} from '@ikki/api-contract/validation'
import z from 'zod'

import { endpoint } from '@/config/endpoint'
import { apiFactory, createQueryKeys } from '@/lib/api'

import {
	${pascalName}CreateDto,
	${pascalName}Dto,
	${pascalName}FilterDto,
	${pascalName}UpdateDto,
} from '../dto'
`

  const queryKeys = `
const ${camelName}Keys = createQueryKeys('${moduleName}', 'master')
`

  // Generate standard CRUD endpoints
  const crudEndpoints = `
export const ${camelName}Api = {
	list: apiFactory({
		method: 'get',
		url: endpoint.${moduleName}.list,
		params: z.object({ ...zq.pagination.shape, ...${pascalName}FilterDto.shape }),
		result: createPaginatedResponseSchema(${pascalName}Dto),
		queryKey: ${camelName}Keys.list,
	}),
	detail: apiFactory({
		method: 'get',
		url: endpoint.${moduleName}.detail,
		params: zc.RecordId,
		result: createSuccessResponseSchema(${pascalName}Dto),
		queryKey: (params) => ${camelName}Keys.detail(params?.id),
	}),
	create: apiFactory({
		method: 'post',
		url: endpoint.${moduleName}.create,
		body: ${pascalName}CreateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [
			${camelName}Keys.lists(),
		],
	}),
	update: apiFactory({
		method: 'put',
		url: endpoint.${moduleName}.update,
		body: ${pascalName}UpdateDto,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [
			${camelName}Keys.lists(),
			({ body }) => ${camelName}Keys.detail(body.id),
		],
	}),
	remove: apiFactory({
		method: 'delete',
		url: endpoint.${moduleName}.remove,
		body: zc.RecordId,
		result: createSuccessResponseSchema(zc.RecordId),
		invalidates: [
			${camelName}Keys.lists(),
			({ body }) => ${camelName}Keys.detail(body.id),
		],
	}),
}
`

  return imports + queryKeys + crudEndpoints
}

/* ============================================================================= */
/* UTILITIES */
/* ============================================================================= */

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + toPascalCase(str).slice(1)
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
