#!/usr/bin/env bun
/**
 * Web codegen — contract-driven.
 *
 * Reads `defineContract(...)` descriptors from the server modules and emits, per
 * feature:
 *
 *   apps/web/src/features/<feature>/dto/<name>.dto.ts   (copied contract DTOs)
 *   apps/web/src/features/<feature>/dto/index.ts        (barrel)
 *   apps/web/src/features/<feature>/api/<name>.api.ts   (typed api-factory calls)
 *   apps/web/src/features/<feature>/api/index.ts        (barrel)
 *
 * ...and updates the endpoint config fragment for each generated feature in
 *   apps/web/src/config/endpoint.gen.ts
 *
 * This is NOT regex parsing: it imports the actual contract objects, so method,
 * path, and input/output DTO refs come from a single typed source of truth.
 *
 * Usage:
 *   bun scripts/generate-web.ts                 # all registered contracts
 *   bun scripts/generate-web.ts location        # one feature
 *   bun scripts/generate-web.ts --dry-run
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import type { ModuleContract } from '../apps/server/src/shared/contract/define-contract'

const REPO_ROOT = resolve(import.meta.dir, '..')
const SERVER_MODULES = join(REPO_ROOT, 'apps/server/src/modules')
const WEB_FEATURES = join(REPO_ROOT, 'apps/web/src/features')
const ENDPOINT_GEN = join(REPO_ROOT, 'apps/web/src/config/endpoint.gen.ts')

/* -------------------------------------------------------------------------- */
/*  Contract registry                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Registered contracts. Add a module's contract import here after adding a
 * `defineContract(...)` export to its `*.contract.ts`.
 */
async function loadContracts(): Promise<ModuleContract[]> {
	const mods = await Promise.all([
		import(join(SERVER_MODULES, 'location/location.contract.ts')),
	])

	const contracts: ModuleContract[] = []
	for (const mod of mods) {
		for (const value of Object.values(mod)) {
			if (isModuleContract(value)) contracts.push(value)
		}
	}
	return contracts
}

function isModuleContract(v: unknown): v is ModuleContract {
	return (
		typeof v === 'object' &&
		v !== null &&
		'feature' in v &&
		'prefix' in v &&
		'endpoints' in v &&
		Array.isArray((v as ModuleContract).endpoints)
	)
}

/* -------------------------------------------------------------------------- */
/*  DTO copy                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Copy the server contract DTO source to the web feature, rewriting the
 * validation import path and stripping server-only contract wiring.
 */
function generateDto(contract: ModuleContract): { path: string; content: string; barrel: string } {
	const src = readFileSync(join(SERVER_MODULES, contract.dtoSource), 'utf-8')

	// The web DTO must not carry the server contract wiring. Drop the
	// `defineContract` import and the `export const <x>Contract = defineContract({...})`
	// block, then rewrite the validation import path.
	let out = src
		// remove the define-contract import line
		.replace(/^import\s+\{[^}]*\}\s+from\s+'@\/shared\/contract\/define-contract'\r?\n/m, '')
		// remove the contract export block (from `export const ...Contract = defineContract({`
		// up to the matching closing `})` at column 0)
		.replace(/\n\/\* -+ CONTRACT -+ \*\/[\s\S]*?\nexport const \w+Contract = defineContract\([\s\S]*?\n\}\)\n?/m, '\n')
		// rewrite validation import
		.replace(/from '@\/shared\/schema'/g, "from '@/lib/validation'")

	out = `${GEN_HEADER}\n${out.trimEnd()}\n`

	const baseName = contract.feature.split('.').pop()!
	const fileName = `${baseName}.dto.ts`
	return {
		path: join(WEB_FEATURES, featureDir(contract), 'dto', fileName),
		content: out,
		barrel: `export * from './${baseName}.dto'\n`,
	}
}

/* -------------------------------------------------------------------------- */
/*  API factory                                                               */
/* -------------------------------------------------------------------------- */

function generateApi(contract: ModuleContract): { path: string; content: string; barrel: string } {
	const baseName = contract.feature.split('.').pop()!

	// Collect referenced identifiers to build imports.
	const dtoRefs = new Set<string>()
	const validationRefs = new Set<string>() // e.g. zc.RecordId → import zc
	let needsZ = false

	const wrapperImports = new Set<string>()

	for (const ep of contract.endpoints) {
		collectRef(ep.output.ref, dtoRefs, validationRefs)
		if (ep.input) collectRef(ep.input.ref, dtoRefs, validationRefs)
		wrapperImports.add(
			ep.output.kind === 'paginated'
				? 'createPaginatedResponseSchema'
				: 'createSuccessResponseSchema',
		)
	}

	const validationNamed = new Set<string>(wrapperImports)
	for (const ref of validationRefs) validationNamed.add(ref.split('.')[0]) // zc, zp, zq

	const lines: string[] = []
	lines.push(GEN_HEADER)
	lines.push('')
	lines.push(`import { ${[...validationNamed].sort().join(', ')} } from '@/lib/validation'`)
	if (needsZ) lines.push(`import z from 'zod'`)
	lines.push('')
	lines.push(`import { endpoint } from '@/config/endpoint.gen'`)
	lines.push('')
	lines.push(`import { apiFactory, createQueryKeys } from '@/lib/api'`)
	lines.push('')
	if (dtoRefs.size > 0) {
		lines.push(`import { ${[...dtoRefs].sort().join(', ')} } from '../dto'`)
		lines.push('')
	}

	const keysVar = `${camel(baseName)}Keys`
	lines.push(`const ${keysVar} = createQueryKeys('${contract.feature}', 'resource')`)
	lines.push('')
	lines.push(`export const ${camel(baseName)}Api = {`)

	for (const ep of contract.endpoints) {
		const epPath = endpointConfigRef(contract.feature, ep.action)
		lines.push(`\t${ep.action}: apiFactory({`)
		lines.push(`\t\tmethod: '${ep.method}',`)
		lines.push(`\t\turl: ${epPath},`)
		if (ep.input) {
			const kind = ep.input.kind === 'query' ? 'params' : 'body'
			lines.push(`\t\t${kind}: ${ep.input.ref.ref},`)
		}
		lines.push(`\t\tresult: ${wrapResult(ep)},`)
		// query keys / invalidation
		if (ep.method === 'get') {
			if (ep.action === 'list') {
				lines.push(`\t\tqueryKey: ${keysVar}.list,`)
			} else if (ep.action === 'detail') {
				lines.push(`\t\tqueryKey: (params) => ${keysVar}.detail(params?.id),`)
			}
		} else {
			lines.push(`\t\tinvalidates: [${keysVar}.lists()],`)
		}
		lines.push(`\t}),`)
	}

	lines.push(`}`)

	return {
		path: join(WEB_FEATURES, featureDir(contract), 'api', `${baseName}.api.ts`),
		content: lines.join('\n') + '\n',
		barrel: `export * from './${baseName}.api'\n`,
	}
}

function wrapResult(ep: ModuleContract['endpoints'][number]): string {
	const inner = ep.output.ref.ref
	return ep.output.kind === 'paginated'
		? `createPaginatedResponseSchema(${inner})`
		: `createSuccessResponseSchema(${inner})`
}

function collectRef(
	ref: ModuleContract['endpoints'][number]['output']['ref'],
	dtoRefs: Set<string>,
	validationRefs: Set<string>,
) {
	if (ref.from === 'validation') validationRefs.add(ref.ref)
	else dtoRefs.add(ref.ref)
}

/* -------------------------------------------------------------------------- */
/*  Endpoint config fragment                                                  */
/* -------------------------------------------------------------------------- */

function endpointConfigRef(feature: string, action: string): string {
	// feature may be dotted (iam.user) → endpoint.iam.user.list
	return `endpoint.${feature}.${action}`
}

function generateEndpointConfig(contracts: ModuleContract[]): string {
	const lines: string[] = []
	lines.push(GEN_HEADER)
	lines.push('')
	lines.push('/** Generated endpoint URL map. Do not edit by hand. */')
	lines.push('export const endpoint = {')

	// group by top-level feature segment to support dotted features
	const tree: Record<string, Record<string, Record<string, string>> | Record<string, string>> = {}
	for (const c of contracts) {
		const segs = c.feature.split('.')
		const actions: Record<string, string> = {}
		for (const ep of c.endpoints) {
			actions[ep.action] = joinUrl(c.prefix, ep.path)
		}
		if (segs.length === 1) {
			tree[segs[0]] = actions
		} else {
			const [top, sub] = segs
			const node = (tree[top] ??= {}) as Record<string, Record<string, string>>
			node[sub] = actions
		}
	}

	for (const [key, val] of Object.entries(tree).sort()) {
		lines.push(`\t${key}: ${renderNode(val, 2)},`)
	}

	lines.push('} as const')
	return lines.join('\n') + '\n'
}

function renderNode(node: Record<string, unknown>, indent: number): string {
	const pad = '\t'.repeat(indent)
	const inner = Object.entries(node)
		.map(([k, v]) => {
			if (typeof v === 'string') return `${pad}${k}: '${v}',`
			return `${pad}${k}: ${renderNode(v as Record<string, unknown>, indent + 1)},`
		})
		.join('\n')
	return `{\n${inner}\n${'\t'.repeat(indent - 1)}}`
}

function joinUrl(prefix: string, path: string): string {
	return `${prefix}${path}`.replace(/^\//, '')
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const GEN_HEADER = `// AUTO-GENERATED by scripts/generate-web.ts — DO NOT EDIT.`

function featureDir(contract: ModuleContract): string {
	// iam.user → iam/user ; location → location
	return contract.feature.replace(/\./g, '/')
}

function camel(s: string): string {
	return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function writeFile(path: string, content: string, dryRun: boolean) {
	if (dryRun) {
		console.log(`   [dry-run] ${path.replace(REPO_ROOT + '/', '')}`)
		return
	}
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, content)
	console.log(`   ✓ ${path.replace(REPO_ROOT + '/', '')}`)
}

function appendBarrel(dir: string, entry: string, dryRun: boolean) {
	const barrelPath = join(dir, 'index.ts')
	let existing = existsSync(barrelPath) ? readFileSync(barrelPath, 'utf-8') : ''
	if (existing.includes(entry.trim())) return
	if (!existing.startsWith(GEN_HEADER)) existing = `${GEN_HEADER}\n${existing}`
	writeFile(barrelPath, existing.trimEnd() + '\n' + entry, dryRun)
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                      */
/* -------------------------------------------------------------------------- */

async function main() {
	const args = process.argv.slice(2)
	const dryRun = args.includes('--dry-run')
	const only = args.find((a) => !a.startsWith('--'))

	console.log('\n📋 Loading contracts...')
	let contracts = await loadContracts()
	if (only) contracts = contracts.filter((c) => c.feature === only || c.feature.startsWith(only + '.'))

	if (contracts.length === 0) {
		console.log('   (no matching contracts)')
		return
	}
	console.log(`   found: ${contracts.map((c) => c.feature).join(', ')}`)

	console.log('\n🔨 Generating per-feature DTO + API...')
	for (const c of contracts) {
		const dtoFile = generateDto(c)
		writeFile(dtoFile.path, dtoFile.content, dryRun)
		appendBarrel(dirname(dtoFile.path), dtoFile.barrel, dryRun)

		const apiFile = generateApi(c)
		writeFile(apiFile.path, apiFile.content, dryRun)
		appendBarrel(dirname(apiFile.path), apiFile.barrel, dryRun)
	}

	console.log('\n🔨 Generating endpoint config...')
	// Merge with any previously-generated features so single-feature runs don't
	// drop others. Simplest robust approach: regenerate from ALL contracts.
	const allContracts = await loadContracts()
	writeFile(ENDPOINT_GEN, generateEndpointConfig(allContracts), dryRun)

	console.log('\n✅ Done!\n')
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
