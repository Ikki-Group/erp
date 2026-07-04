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
 * Usage (from apps/server):
 *   bun run generate:web                 # all registered contracts
 *   bun run generate:web location        # one feature
 *   bun run generate:web:preview         # dry-run
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import type { ModuleContract } from '@/shared/contract/define-contract'

// apps/server/scripts → apps/server → apps → <repo root>
const REPO_ROOT = resolve(import.meta.dir, '../../..')
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
	const paths = ['location/location.contract.ts']

	const contracts: ModuleContract[] = []
	for (const rel of paths) {
		const mod: unknown = await import(join(SERVER_MODULES, rel))
		if (typeof mod !== 'object' || mod === null) continue
		for (const value of Object.values(mod)) {
			if (isModuleContract(value)) contracts.push(value)
		}
	}
	return contracts
}

function isModuleContract(v: unknown): v is ModuleContract {
	if (typeof v !== 'object' || v === null) return false
	return (
		'feature' in v &&
		'prefix' in v &&
		'endpoints' in v &&
		Array.isArray((v as { endpoints: unknown }).endpoints)
	)
}

/* -------------------------------------------------------------------------- */
/*  DTO copy                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Copy the server contract DTO source to the web feature, rewriting the
 * validation import path and stripping server-only contract wiring.
 */
function generateDto(contract: ModuleContract): { path: string; content: string } {
	const src = readFileSync(join(SERVER_MODULES, contract.dtoSource), 'utf-8')

	// The web DTO must not carry the server contract wiring. Drop the
	// `defineContract` import and the `export const <x>Contract = defineContract({...})`
	// block, then rewrite the validation import path.
	let out = src
		// remove the define-contract import line
		.replace(/^import\s+\{[^}]*\}\s+from\s+'@\/shared\/contract\/define-contract'\r?\n/mu, '')
		// remove the contract export block (from `export const ...Contract = defineContract({`
		// up to the matching closing `})` at column 0)
		.replace(
			/\n\/\* -+ CONTRACT -+ \*\/[\s\S]*?\nexport const \w+Contract = defineContract\([\s\S]*?\n\}\)\n?/mu,
			'\n',
		)
		// rewrite validation import
		.replace(/from '@\/shared\/schema'/gu, "from '@/lib/validation'")

	out = `${GEN_HEADER}\n${out.trimEnd()}\n`

	return {
		path: join(WEB_FEATURES, contract.feature, `${contract.entity}.dto.ts`),
		content: out,
	}
}

/* -------------------------------------------------------------------------- */
/*  API factory                                                               */
/* -------------------------------------------------------------------------- */

function generateApi(
	contract: ModuleContract,
	multiEntity: boolean,
): { path: string; content: string } {
	const entity = contract.entity

	// Collect referenced identifiers to build imports.
	const dtoRefs = new Set<string>()
	const validationRefs = new Set<string>() // e.g. zc.RecordId → import zc

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
	for (const ref of validationRefs) validationNamed.add(ref.split('.')[0] ?? ref) // zc, zp, zq

	const lines: string[] = []
	lines.push(GEN_HEADER)
	lines.push('')
	lines.push(`import { ${[...validationNamed].sort().join(', ')} } from '@/lib/validation'`)
	lines.push('')
	lines.push(`import { endpoint } from '@/config/endpoint.gen'`)
	lines.push('')
	lines.push(`import { apiFactory, createQueryKeys } from '@/lib/api'`)
	lines.push('')
	if (dtoRefs.size > 0) {
		lines.push(`import { ${[...dtoRefs].sort().join(', ')} } from './${entity}.dto'`)
		lines.push('')
	}

	const keysVar = `${camel(entity)}Keys`
	lines.push(`const ${keysVar} = createQueryKeys('${contract.feature}', '${entity}')`)
	lines.push('')
	lines.push(`export const ${camel(entity)}Api = {`)

	for (const ep of contract.endpoints) {
		const epPath = endpointConfigRef(contract, ep.action, multiEntity)
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
		path: join(WEB_FEATURES, contract.feature, `${entity}.api.ts`),
		content: lines.join('\n') + '\n',
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

function endpointConfigRef(contract: ModuleContract, action: string, multiEntity: boolean): string {
	return multiEntity
		? `endpoint.${contract.feature}.${contract.entity}.${action}`
		: `endpoint.${contract.feature}.${action}`
}

/** A node in the endpoint URL tree: either a leaf URL or a nested group. */
type EndpointNode = string | { [key: string]: EndpointNode }

function generateEndpointConfig(contracts: ModuleContract[]): string {
	const lines: string[] = []
	lines.push(GEN_HEADER)
	lines.push('')
	lines.push('/** Generated endpoint URL map. Do not edit by hand. */')
	lines.push('export const endpoint = {')

	// Count entities per feature to decide flat vs nested.
	const entityCount = new Map<string, number>()
	for (const c of contracts) entityCount.set(c.feature, (entityCount.get(c.feature) ?? 0) + 1)

	const tree: Record<string, EndpointNode> = {}
	for (const c of contracts) {
		const actions: Record<string, EndpointNode> = {}
		for (const ep of c.endpoints) actions[ep.action] = joinUrl(c.prefix, ep.path)

		if ((entityCount.get(c.feature) ?? 1) > 1) {
			// multi-entity feature → endpoint.<feature>.<entity>.<action>
			const existing = tree[c.feature]
			const node: { [key: string]: EndpointNode } =
				typeof existing === 'object' ? existing : {}
			node[c.entity] = actions
			tree[c.feature] = node
		} else {
			// single-entity feature → endpoint.<feature>.<action>
			tree[c.feature] = actions
		}
	}

	for (const [key, val] of Object.entries(tree).sort((a, b) => a[0].localeCompare(b[0]))) {
		lines.push(`\t${key}: ${renderNode(val, 2)},`)
	}

	lines.push('} as const')
	return lines.join('\n') + '\n'
}

function renderNode(node: EndpointNode, indent: number): string {
	if (typeof node === 'string') return `'${node}'`
	const pad = '\t'.repeat(indent)
	const inner = Object.entries(node)
		.map(([k, v]) => `${pad}${k}: ${renderNode(v, indent + 1)},`)
		.join('\n')
	return `{\n${inner}\n${'\t'.repeat(indent - 1)}}`
}

function joinUrl(prefix: string, path: string): string {
	return `${prefix}${path}`.replace(/^\//u, '')
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const GEN_HEADER = `// AUTO-GENERATED by scripts/generate-web.ts — DO NOT EDIT.`

function camel(s: string): string {
	return s.replace(/-([a-z])/gu, (_, c: string) => c.toUpperCase())
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

/**
 * Write the feature barrel `index.ts`. The generator owns the dto/api exports
 * (one block per entity) and preserves any hand-written exports below a marker
 * (e.g. `./components`, `./utils`, `./pages`).
 */
function writeFeatureBarrel(feature: string, entities: string[], dryRun: boolean) {
	const barrelPath = join(WEB_FEATURES, feature, 'index.ts')
	const MANUAL_MARKER = '/* --- manual exports (preserved) --- */'

	// Preserve any manual exports written below the marker.
	let manual = ''
	if (existsSync(barrelPath)) {
		const existing = readFileSync(barrelPath, 'utf-8')
		const idx = existing.indexOf(MANUAL_MARKER)
		if (idx === -1) {
			// First migration: keep any non-generated (dto/api) export lines.
			manual = existing
				.split('\n')
				.filter(
					(l) =>
						l.startsWith('export') &&
						!/\.\/[\w-]+\.(dto|api)'/u.test(l) &&
						!/\.\/(api|dto)'/u.test(l),
				)
				.join('\n')
				.trim()
		} else {
			manual = existing.slice(idx + MANUAL_MARKER.length).trim()
		}
	}

	const lines = [GEN_HEADER, '']
	for (const entity of entities.sort()) {
		lines.push(`export * from './${entity}.dto'`)
		lines.push(`export * from './${entity}.api'`)
	}
	lines.push('')
	lines.push(MANUAL_MARKER)
	if (manual) lines.push(manual)

	writeFile(barrelPath, lines.join('\n').trimEnd() + '\n', dryRun)
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                      */
/* -------------------------------------------------------------------------- */

async function main() {
	const args = process.argv.slice(2)
	const dryRun = args.includes('--dry-run')
	const only = args.find((a) => !a.startsWith('--'))

	console.log('\n📋 Loading contracts...')
	const allContracts = await loadContracts()
	let contracts = allContracts
	if (only) contracts = contracts.filter((c) => c.feature === only)

	if (contracts.length === 0) {
		console.log('   (no matching contracts)')
		return
	}
	console.log(`   found: ${contracts.map((c) => `${c.feature}/${c.entity}`).join(', ')}`)

	// A feature is multi-entity if more than one contract shares its `feature`.
	const entityCount = new Map<string, number>()
	for (const c of allContracts) entityCount.set(c.feature, (entityCount.get(c.feature) ?? 0) + 1)

	console.log('\n🔨 Generating flat DTO + API per entity...')
	// Group target contracts by feature to write one barrel per feature.
	const byFeature = new Map<string, ModuleContract[]>()
	for (const c of contracts) {
		const arr = byFeature.get(c.feature) ?? []
		arr.push(c)
		byFeature.set(c.feature, arr)
	}

	for (const c of contracts) {
		const multiEntity = (entityCount.get(c.feature) ?? 1) > 1

		const dtoFile = generateDto(c)
		writeFile(dtoFile.path, dtoFile.content, dryRun)

		const apiFile = generateApi(c, multiEntity)
		writeFile(apiFile.path, apiFile.content, dryRun)
	}

	// Barrel per feature — include ALL entities of the feature (not just the
	// filtered subset) so a single-entity run doesn't drop sibling exports.
	for (const feature of byFeature.keys()) {
		const entities = allContracts.filter((c) => c.feature === feature).map((c) => c.entity)
		writeFeatureBarrel(feature, entities, dryRun)
	}

	console.log('\n🔨 Generating endpoint config...')
	// Regenerate from ALL contracts so single-feature runs don't drop others.
	writeFile(ENDPOINT_GEN, generateEndpointConfig(allContracts), dryRun)

	console.log('\n✅ Done!\n')
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
