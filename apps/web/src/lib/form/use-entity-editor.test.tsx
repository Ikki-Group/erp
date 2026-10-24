// @vitest-environment jsdom
import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { useEntityEditor } from './use-entity-editor'

const clients: QueryClient[] = []
afterEach(() => {
	cleanup()
	for (const client of clients) client.clear()
	clients.length = 0
})

function createWrapper() {
	const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
	clients.push(client)
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={client}>{children}</QueryClientProvider>
	}
}

const schema = z.object({ name: z.string().min(1) })

describe('entity editing session', () => {
	it('retains dirty values and reset baseline when refreshed defaults arrive', () => {
		const { result, rerender } = renderHook(
			({ name }) =>
				useEntityEditor({
					defaultValues: { name },
					schema,
					mutation: { mutationFn: async (value: { name: string }) => value },
					toPayload: (value) => value,
					successMessage: 'Saved',
					onSaved: () => {},
				}),
			{ initialProps: { name: 'Original' }, wrapper: createWrapper() },
		)
		act(() => result.current.setFieldValue('name', 'Unsaved edit'))
		rerender({ name: 'Refreshed server value' })
		expect(result.current.state.values.name).toBe('Unsaved edit')
		expect(result.current.state.isDirty).toBe(true)
		act(() => result.current.reset())
		expect(result.current.state.values.name).toBe('Original')
	})

	it('keeps entered values and reports the feature error after a failed save, then allows retry', async () => {
		let fail = true
		let completed = false
		let storedName = 'Original'
		const { result } = renderHook(
			() =>
				useEntityEditor({
					defaultValues: { name: 'Original' },
					schema,
					mutation: {
						mutationFn: async (value: { name: string }) => {
							if (fail) throw new Error('conflict')
							storedName = value.name
							return value
						},
					},
					toPayload: (value) => ({ name: value.name.trim() }),
					mapError: () => new Error('Name already exists.'),
					successMessage: 'Saved',
					onSaved: () => {
						completed = true
					},
				}),
			{ wrapper: createWrapper() },
		)
		act(() => result.current.setFieldValue('name', ' Edited '))
		await act(async () => {
			await result.current.handleSubmit()
		})
		expect(completed).toBe(false)
		expect(storedName).toBe('Original')
		expect(result.current.state.values.name).toBe(' Edited ')
		expect(result.current.state.errorMap.onSubmit).toBe('Name already exists.')
		fail = false
		act(() => result.current.setFieldValue('name', ' Retry '))
		await act(async () => {
			await result.current.handleSubmit()
		})
		expect(storedName).toBe('Retry')
		expect(completed).toBe(true)
	})
})
