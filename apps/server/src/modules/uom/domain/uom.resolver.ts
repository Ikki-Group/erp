import { Decimal, toDecimal } from '@/shared/utils/money.ts'

import type { ConversionStepDto, UomConversionDto } from '../uom.contract.ts'
import { MAX_CONVERSION_HOPS } from '../uom.internal.ts'

interface ConversionEdge {
	toUomId: number
	factor: string
	direction: 'forward' | 'inverse'
}

export interface ConversionResult {
	result: string
	path: ConversionStepDto[]
}

export function resolveConversion(
	fromUomId: number,
	toUomId: number,
	quantity: string,
	conversions: UomConversionDto[],
): ConversionResult | null {
	if (fromUomId === toUomId) return { result: quantity, path: [] }

	const graph = buildGraph(conversions)
	const path = bfs(graph, fromUomId, toUomId)
	if (!path) return null

	let accumulated = toDecimal(quantity)
	const steps: ConversionStepDto[] = []
	for (const edge of path) {
		const factor = toDecimal(edge.factor)
		if (edge.direction === 'forward') accumulated = accumulated.mul(factor)
		else accumulated = accumulated.div(factor)
		steps.push({
			fromUomId: edge.direction === 'forward' ? edge.fromUomId : edge.toUomId,
			toUomId: edge.direction === 'forward' ? edge.toUomId : edge.fromUomId,
			factor: edge.factor,
		})
	}

	return { result: formatDecimal(accumulated), path: steps }
}

interface PathEdge extends ConversionEdge {
	fromUomId: number
}

function buildGraph(conversions: UomConversionDto[]): Map<number, ConversionEdge[]> {
	const graph = new Map<number, ConversionEdge[]>()
	for (const conv of conversions) {
		if (!graph.has(conv.fromUomId)) graph.set(conv.fromUomId, [])
		graph.get(conv.fromUomId)!.push({
			toUomId: conv.toUomId,
			factor: conv.factor,
			direction: 'forward',
		})
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
		for (const edge of graph.get(current.nodeId) ?? []) {
			if (visited.has(edge.toUomId)) continue
			const newPath = [...current.path, { ...edge, fromUomId: current.nodeId }]
			if (edge.toUomId === end) return newPath
			visited.add(edge.toUomId)
			queue.push({ nodeId: edge.toUomId, path: newPath, depth: current.depth + 1 })
		}
	}
	return null
}

function formatDecimal(value: Decimal): string {
	return value.toDecimalPlaces(6).toNumber().toString()
}
