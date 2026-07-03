#!/usr/bin/env bun
/**
 * Auto-Generate Endpoint Config from Server Routes
 *
 * Scans all server route files and generates apps/web/src/config/endpoint.ts
 * Single source of truth: server routes → web endpoint config
 *
 * Usage:
 *   bun scripts/generate-endpoints.ts
 *   bun scripts/generate-endpoints.ts --dry-run
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const PROJECT_ROOT = '/Users/rizqynugroho9/workspace/ikki/erp'
const SERVER_MODULES = join(PROJECT_ROOT, 'apps/server/src/modules')
const ENDPOINT_CONFIG = join(PROJECT_ROOT, 'apps/web/src/config/endpoint.ts')

interface RouteInfo {
	module: string
	method: string
	path: string
}

async function main() {
	const dryRun = process.argv.includes('--dry-run')

	console.log(`\n📋 Scanning server routes...`)
	const routes = scanServerRoutes()

	console.log(`\n🔨 Generating endpoint config...`)
	const config = generateEndpointConfig(routes)

	if (!dryRun) {
		writeFileSync(ENDPOINT_CONFIG, config)
		console.log(`   ✓ Generated: apps/web/src/config/endpoint.ts`)
	} else {
		console.log(`   [DRY-RUN] Would generate: apps/web/src/config/endpoint.ts`)
		console.log(`\n📋 Preview (first 60 lines):`)
		console.log('---')
		console.log(config.split('\n').slice(0, 60).join('\n'))
		console.log('---')
	}

	console.log(`\n✅ Done!`)
}

function scanServerRoutes(): Map<string, Set<string>> {
	const modules = readdirSync(SERVER_MODULES)
	const routeMap = new Map<string, Set<string>>()

	for (const moduleName of modules) {
		const routePath = join(SERVER_MODULES, moduleName, `${moduleName}.route.ts`)

		if (!existsSync(routePath)) continue

		const content = readFileSync(routePath, 'utf-8')
		const routes = extractRoutesFromFile(content, moduleName)

		if (routes.size > 0) {
			routeMap.set(moduleName, routes)
		}
	}

	return routeMap
}

function extractRoutesFromFile(content: string, moduleName: string): Set<string> {
	const routes = new Set<string>()

	// Extract prefix from: new Elysia({ prefix: '/location' })
	const prefixMatch = content.match(/prefix:\s*['"]([^'"]+)['"]/)?.[1]
	if (!prefixMatch) return routes

	// Extract routes: .get('/list', ...) → /location/list
	const methods = ['get', 'post', 'put', 'delete', 'patch']
	for (const method of methods) {
		const routeRegex = new RegExp(`\\.${method}\\s*\\(\\s*['"]([^'"]+)['"]`, 'g')
		let match
		while ((match = routeRegex.exec(content)) !== null) {
			const path = match[1]
			const fullPath = `${prefixMatch}${path}`
			routes.add(fullPath)
		}
	}

	return routes
}

function generateEndpointConfig(routeMap: Map<string, Set<string>>): string {
	const lines: string[] = []

	lines.push(`function p(base: string, ...sub: string[]) {`)
	lines.push(`\treturn [base, ...sub].filter(Boolean).join('/')`)
	lines.push(`}`)
	lines.push(``)
	lines.push(`function crud(base: string) {`)
	lines.push(`\treturn {`)
	lines.push(`\t\tlist: p(base, 'list'),`)
	lines.push(`\t\tdetail: p(base, 'detail'),`)
	lines.push(`\t\tcreate: p(base, 'create'),`)
	lines.push(`\t\tupdate: p(base, 'update'),`)
	lines.push(`\t\tremove: p(base, 'remove'),`)
	lines.push(`\t}`)
	lines.push(`}`)
	lines.push(``)

	// Generate endpoint objects by module
	for (const [moduleName, routes] of Array.from(routeMap.entries()).sort()) {
		const sortedRoutes = Array.from(routes).sort()
		const varName = moduleName.replace(/-/g, '_') // sales-type → sales_type (valid JS variable)

		// Check if it's standard CRUD
		const isCrud =
			sortedRoutes.includes(`/${moduleName}/list`) &&
			sortedRoutes.includes(`/${moduleName}/detail`) &&
			sortedRoutes.includes(`/${moduleName}/create`) &&
			sortedRoutes.includes(`/${moduleName}/update`) &&
			sortedRoutes.includes(`/${moduleName}/remove`) &&
			sortedRoutes.length === 5

		if (isCrud) {
			// Use crud() helper for standard CRUD
			lines.push(`const ${varName} = crud('${moduleName}')`)
		} else {
			// Generate custom endpoint object
			lines.push(`const ${varName} = {`)
			for (const route of sortedRoutes) {
				const actionName = extractActionName(route, moduleName)
				lines.push(`\t${actionName}: '${route.replace(/^\//, '')}',`)
			}
			lines.push(`}`)
		}
	}

	lines.push(``)
	lines.push(`export const endpoint = {`)
	for (const moduleName of Array.from(routeMap.keys()).sort()) {
		const varName = moduleName.replace(/-/g, '_')
		// For hyphenated names, use bracket notation: endpoint['sales-type']
		if (moduleName.includes('-')) {
			lines.push(`\t['${moduleName}']: ${varName},`)
		} else {
			lines.push(`\t${moduleName},`)
		}
	}
	lines.push(`}`)

	return lines.join('\n') + '\n'
}

function extractActionName(route: string, moduleName: string): string {
	// /location/list → list
	// /location/change-password → changePassword
	const parts = route.split('/')
	const action = parts[parts.length - 1]

	// Convert kebab-case to camelCase
	return action.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

main().catch(console.error)
