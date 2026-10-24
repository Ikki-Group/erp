import { describe, expect, it } from 'vitest'

import { createWorkflowAction, type WorkflowActionOptions } from './workflow-action'

type Entity = { id: number }

function interaction(execute: WorkflowActionOptions<Entity>['execute']) {
	let dialog: { onConfirm: () => Promise<void> } | undefined
	let close: (accepted: boolean) => void = () => {
		throw new Error('No open confirmation')
	}
	let allowed = true
	let confirmations = 0
	const successes: string[] = []
	const pending: boolean[] = []
	const action = createWorkflowAction<Entity>(
		() => ({
			availability: () => allowed || 'Permission changed. Reload the page.',
			confirmation: (entity) => ({ title: 'Delete?', description: `Delete ${entity.id}?` }),
			execute,
			successMessage: 'Deleted',
		}),
		{
			confirm: (options) => {
				confirmations++
				dialog = options
				return new Promise<boolean>((resolve) => {
					close = resolve
				})
			},
			success: (message) => {
				successes.push(message)
			},
			onPendingChange: (value) => {
				pending.push(value)
			},
		},
	)
	return {
		action,
		successes,
		pending,
		get confirmations() {
			return confirmations
		},
		confirm: () => {
			if (!dialog) throw new Error('No open confirmation')
			return dialog.onConfirm()
		},
		close: (accepted: boolean) => close(accepted),
		deny: () => {
			allowed = false
		},
	}
}

describe('consequential workflow action', () => {
	it('suppresses duplicate dialogs and duplicate submissions, including after success', async () => {
		let executions = 0
		let complete!: () => void
		const flow = interaction(async () => {
			executions++
			await new Promise<void>((resolve) => {
				complete = resolve
			})
		})
		const result = flow.action.run({ id: 1 })
		expect(await flow.action.run({ id: 1 })).toBe(false)
		expect(flow.confirmations).toBe(1)
		expect(flow.action.isPending).toBe(true)
		const first = flow.confirm()
		expect(flow.confirm()).toBe(first)
		await Promise.resolve()
		expect(executions).toBe(1)
		complete()
		await first
		await flow.confirm()
		expect(executions).toBe(1)
		expect(flow.successes).toEqual(['Deleted'])
		flow.close(true)
		expect(await result).toBe(true)
		expect(flow.pending).toEqual([true, false])
		expect(flow.action.isPending).toBe(false)
	})

	it('keeps execution errors retryable in the same dialog without a false success toast', async () => {
		let attempts = 0
		const flow = interaction(async () => {
			if (++attempts === 1) throw new Error('Material is unavailable')
		})
		const result = flow.action.run({ id: 1 })
		await expect(flow.confirm()).rejects.toThrow('Material is unavailable')
		expect(flow.successes).toEqual([])
		expect(flow.action.isPending).toBe(true)
		await flow.confirm()
		expect(attempts).toBe(2)
		expect(flow.successes).toEqual(['Deleted'])
		flow.close(true)
		await result
	})

	it('rechecks availability after confirmation and never executes a denied action', async () => {
		let executions = 0
		const flow = interaction(async () => {
			executions++
		})
		const result = flow.action.run({ id: 1 })
		flow.deny()
		await expect(flow.confirm()).rejects.toThrow('Permission changed')
		expect(executions).toBe(0)
		flow.close(false)
		expect(await result).toBe(false)
		expect(await flow.action.run({ id: 1 })).toBe(false)
		expect(flow.confirmations).toBe(1)
	})

	it('releases the interaction after cancellation without executing or notifying success', async () => {
		let executions = 0
		const flow = interaction(async () => {
			executions++
		})
		const first = flow.action.run({ id: 1 })
		flow.close(false)
		expect(await first).toBe(false)
		expect(executions).toBe(0)
		expect(flow.successes).toEqual([])
		const second = flow.action.run({ id: 2 })
		expect(flow.confirmations).toBe(2)
		flow.close(false)
		await second
	})
})
