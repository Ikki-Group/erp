import { expect, test } from 'bun:test'
import '../setup'

test('example-02', () => {
	expect(true).toBe(true)
})

test.concurrent('example-con-02', () => {
	expect(true).toBe(true)
})
