import { RelationMap } from '@/core/utils/relation-map'

import { describe, expect, it } from 'bun:test'

type User = {
	id: string
	name: string
}

type Order = {
	id: string
	userId: string
}

type Item = {
	id: string
	orderId: string
	qty: number
}

describe('RelationMap', () => {
	const users: User[] = [
		{ id: 'u1', name: 'Alice' },
		{ id: 'u2', name: 'Bob' },
	]

	const orders: Order[] = [
		{ id: 'o1', userId: 'u1' },
		{ id: 'o2', userId: 'u2' },
	]

	const items: Item[] = [
		{ id: 'i1', orderId: 'o1', qty: 1 },
		{ id: 'i2', orderId: 'o1', qty: 2 },
		{ id: 'i3', orderId: 'o2', qty: 3 },
	]

	it('fromArray should map correctly', () => {
		const map = RelationMap.fromArray(users, (u) => u.id)

		expect(map.get('u1')?.name).toBe('Alice')
		expect(map.get('u2')?.name).toBe('Bob')
	})

	it('groupFromArray should group correctly', () => {
		const map = RelationMap.groupFromArray(items, (i) => i.orderId)

		expect(map.get('o1')?.length).toBe(2)
		expect(map.get('o2')?.length).toBe(1)
	})

	it('getRequired should return value', () => {
		const map = RelationMap.fromArray(users, (u) => u.id)

		const user = map.getRequired('u1')
		expect(user.name).toBe('Alice')
	})

	it('getRequired should throw if missing', () => {
		const map = RelationMap.fromArray(users, (u) => u.id)

		expect(() => map.getRequired('invalid')).toThrow()
	})

	it('getMany should skip missing keys', () => {
		const map = RelationMap.fromArray(users, (u) => u.id)

		const result = map.getMany(['u1', 'invalid'])
		expect(result.length).toBe(1)
		expect(result[0]!.name).toBe('Alice')
	})

	it('getManyRequired should throw on missing key', () => {
		const map = RelationMap.fromArray(users, (u) => u.id)

		expect(() => map.getManyRequired(['u1', 'invalid'])).toThrow()
	})

	it('leftJoin should work with optional relation', () => {
		const orderMap = RelationMap.fromArray(orders, (o) => o.id)
		const userMap = RelationMap.fromArray(users, (u) => u.id)

		const result = orderMap.leftJoin(
			userMap,
			(o) => o.userId,
			(order, user) => ({
				...order,
				userName: user?.name ?? null,
			}),
		)

		expect(result[0]!.userName).toBe('Alice')
	})

	it('innerJoinRequired should join correctly', () => {
		const orderMap = RelationMap.fromArray(orders, (o) => o.id)
		const userMap = RelationMap.fromArray(users, (u) => u.id)

		const result = orderMap.innerJoinRequired(
			userMap,
			(o) => o.userId,
			(order, user) => ({
				...order,
				userName: user.name,
			}),
		)

		expect(result[1]!.userName).toBe('Bob')
	})

	it('innerJoinRequired should throw if relation missing', () => {
		const orderMap = RelationMap.fromArray([{ id: 'o1', userId: 'missing' }], (o) => o.id)

		const userMap = RelationMap.fromArray(users, (u) => u.id)

		expect(() =>
			orderMap.innerJoinRequired(
				userMap,
				(o) => o.userId,
				(order, user) => ({ ...order, user }),
			),
		).toThrow()
	})

	it('innerJoinMany should join 1:N correctly', () => {
		const orderMap = RelationMap.fromArray(orders, (o) => o.id)
		const itemMap = RelationMap.groupFromArray(items, (i) => i.orderId)

		const result = orderMap.innerJoinMany(
			itemMap,
			(o) => o.id,
			(order, items) => ({
				...order,
				totalQty: items.reduce((sum, i) => sum + i.qty, 0),
			}),
		)

		expect(result[0]!.totalQty).toBe(3)
		expect(result[1]!.totalQty).toBe(3)
	})

	it('innerJoinMany should throw if missing relation', () => {
		const orderMap = RelationMap.fromArray([{ id: 'o1', userId: 'u1' }], (o) => o.id)

		const itemMap = RelationMap.groupFromArray([], (i: Item) => i.orderId)

		expect(() =>
			orderMap.innerJoinMany(
				itemMap,
				(o) => o.id,
				(order, items) => ({ ...order, items }),
			),
		).toThrow()
	})

	it('mapToArray should transform values', () => {
		const map = RelationMap.fromArray(users, (u) => u.id)

		const result = map.mapToArray((user) => user.name)

		expect(result).toContain('Alice')
		expect(result).toContain('Bob')
	})
})
