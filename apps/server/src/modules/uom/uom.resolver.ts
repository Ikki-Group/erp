import type { ConversionStepDto, UomConversionDto } from './uom.contract.ts'
import { MAX_CONVERSION_HOPS } from './uom.internal.ts'

// ─── Types ───

interface ConversionEdge {
	toUomId: number
	factor: string
	direction: 'forward' | 'inverse'
}

export interface ConversionResult {
	result: string
	path: ConversionStepDto[]
}

// ─── Resolver ───

/**
 * Resolves a multi-hop conversion between two UoMs using BFS.
 * Traverses the conversion graph bidirectionally (forward uses factor, inverse uses 1/factor).
 *
 * Returns ConversionResult with the converted quantity and the path taken, or null if no path exists.
 */
export function resolveConversion(
	fromUomId: number,
	toUomId: number,
	quantity: string,
	conversions: UomConversionDto[],
): ConversionResult | null {
	// Same UoM — identity conversion
	if (fromUomId === toUomId) {
		return { result: quantity, path: [] }
	}

	// Build adjacency list (bidirectional graph)
	const graph = buildGraph(conversions)

	// BFS to find shortest path
	const path = bfs(graph, fromUomId, toUomId)
	if (!path) return null

	// Calculate result by accumulating factors along the path
	let accumulated = parseFloat(quantity)
	const steps: ConversionStepDto[] = []

	for (const edge of path) {
		const factor = parseFloat(edge.factor)
		if (edge.direction === 'forward') {
			accumulated *= factor
		} else {
			accumulated /= factor
		}
		steps.push({
			fromUomId: edge.direction === 'forward' ? edge.fromUomId : edge.toUomId,
			toUomId: edge.direction === 'forward' ? edge.toUomId : edge.fromUomId,
			factor: edge.factor,
		})
	}

	// Format result — remove trailing zeros but keep decimal precision
	const result = formatDecimal(accumulated)

	return { result, path: steps }
}

// ─── Internal Helpers ───

interface PathEdge extends ConversionEdge {
	fromUomId: number
}

function buildGraph(conversions: UomConversionDto[]): Map<number, ConversionEdge[]> {
	const graph = new Map<number, ConversionEdge[]>()

	for (const conv of conversions) {
		// Forward edge: fromUomId → toUomId (multiply by factor)
		if (!graph.has(conv.fromUomId)) graph.set(conv.fromUomId, [])
		graph.get(conv.fromUomId)!.push({
			toUomId: conv.toUomId,
			factor: conv.factor,
			direction: 'forward',
		})

		// Inverse edge: toUomId → fromUomId (divide by factor)
		if (!graph.has(conv.toUomId)) graph.set(conv.toUomId, [])
		graph.get(conv.toUomId)!.push({
			toUomId: conv.fromUomId,
			factor: conv.factor,
			direction: 'inverse',
		})
	}

	return graph
}

function bfs(graph: Map<number, ConversionEdge[]>, start: number, end: number): PathEdge[] | null {
	const visited = new Set<number>([start])
	const queue: { nodeId: number; path: PathEdge[]; depth: number }[] = [
		{ nodeId: start, path: [], depth: 0 },
	]

	while (queue.length > 0) {
		const current = queue.shift()!

		if (current.depth >= MAX_CONVERSION_HOPS) continue

		const edges = graph.get(current.nodeId)
		if (!edges) continue

		for (const edge of edges) {
			if (visited.has(edge.toUomId)) continue

			const newPath: PathEdge[] = [...current.path, { ...edge, fromUomId: current.nodeId }]

			if (edge.toUomId === end) {
				return newPath
			}

			visited.add(edge.toUomId)
			queue.push({ nodeId: edge.toUomId, path: newPath, depth: current.depth + 1 })
		}
	}

	return null
}

function formatDecimal(value: number): string {
	// Use sufficient precision and strip trailing zeros
	const str = value.toPrecision(15)
	const num = parseFloat(str)
	return num.toString()
}
