// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { locationResource } from '@/features/location/api.ts'
import { LocationFilterDto, type LocationDto } from '@/features/location/dto/index.ts'

import { assignmentResource } from '../api.ts'
import type { MaterialLocationDto } from '../dto/index.ts'
import { LocationAssignment } from './location-assignment.tsx'

const { permissions, success } = vi.hoisted(() => ({
	permissions: new Set<string>(),
	success: vi.fn<(options: { title: string; type: string }) => void>(),
}))

vi.mock('@/components/ui/toast', () => ({ toast: { add: success } }))

const audit = {
	createdAt: new Date('2026-01-01'),
	updatedAt: new Date('2026-01-01'),
	createdBy: null,
	updatedBy: null,
}
const locations: LocationDto[] = Array.from({ length: 125 }, (_, index) => ({
	id: index + 1,
	code: `LOC-${index + 1}`,
	name: `Location ${index + 1}`,
	type: 'store',
	address: null,
	phone: null,
	isActive: true,
	...audit,
}))

function deferred() {
	let resolve!: () => void
	const promise = new Promise<void>((done) => {
		resolve = done
	})
	return { promise, resolve }
}

function setup() {
	const client = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0, throwOnError: true },
			mutations: { retry: false },
		},
	})
	const state = {
		locationFails: false,
		assignmentFails: false,
		mutationFails: false,
		commitThenFail: false,
		empty: false,
		assignmentGate: undefined as Promise<void> | undefined,
		mutationGate: undefined as Promise<void> | undefined,
		assigned: new Set([1]),
	}
	const listRead = vi.fn<(query: unknown) => void>()
	const assignmentRead = vi.fn<(query: unknown) => void>()
	const assign = vi.fn<(input: { materialId: number; locationId: number }) => void>()
	const unassign = vi.fn<(input: { materialId: number; locationId: number }) => void>()

	vi.spyOn(locationResource.list, 'queryOptions').mockImplementation((args) => ({
		queryKey: ['test-locations', args],
		queryFn: async () => {
			listRead(args)
			if (state.locationFails) throw new Error('Locations offline')
			const filter = LocationFilterDto.parse(args)
			const q = filter.q ?? ''
			const { page, limit } = filter
			const filtered = state.empty ? [] : locations.filter((location) => location.name.includes(q))
			return {
				success: true,
				code: 'OK',
				data: filtered.slice((page - 1) * limit, page * limit),
				meta: {
					page,
					limit,
					total: filtered.length,
					totalPages: Math.ceil(filtered.length / limit),
				},
			}
		},
	}))
	vi.spyOn(assignmentResource.byMaterial, 'queryOptions').mockImplementation((args) => ({
		queryKey: assignmentResource.byMaterial.queryKey(args),
		queryFn: async () => {
			assignmentRead(args)
			if (state.assignmentGate) await state.assignmentGate
			if (state.assignmentFails) throw new Error('Assignments offline')
			const data: MaterialLocationDto[] = [...state.assigned].map((locationId) => ({
				id: locationId,
				locationId,
				materialId: Number(args.materialId),
				...audit,
			}))
			return { success: true, code: 'OK', data }
		},
	}))
	for (const [resource, call, desired] of [
		[assignmentResource.assign, assign, true],
		[assignmentResource.unassign, unassign, false],
	] as const) {
		vi.spyOn(resource, 'mutationOptions').mockImplementation((overrides) => ({
			...overrides,
			mutationFn: async (args) => {
				call(args)
				if (state.mutationGate) await state.mutationGate
				if (state.mutationFails) throw new Error('Save offline')
				if (desired) state.assigned.add(args.locationId)
				else state.assigned.delete(args.locationId)
				if (state.commitThenFail) throw new Error('Response lost')
				await client.invalidateQueries({
					queryKey: assignmentResource.byMaterial.queryKey({ materialId: args.materialId }),
				})
				return { success: true, code: 'OK', data: { id: args.locationId } }
			},
		}))
	}

	const view = (materialId: number) => (
		<QueryClientProvider client={client}>
			<LocationAssignment
				materialId={materialId}
				permissions={{
					canRead: permissions.has('material.read') && permissions.has('location.read'),
					canAssign: permissions.has('material.create'),
					canUnassign: permissions.has('material.delete'),
				}}
			/>
		</QueryClientProvider>
	)
	return { state, client, assign, unassign, listRead, assignmentRead, view }
}

beforeEach(() => {
	permissions.clear()
	for (const permission of [
		'material.read',
		'location.read',
		'material.create',
		'material.delete',
	]) {
		permissions.add(permission)
	}
	success.mockClear()
})
afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
})

async function loaded() {
	await screen.findByText('Location 1')
	await waitFor(() => expect(screen.queryByText('Loading assignments...')).toBeNull())
}

describe('LocationAssignment', () => {
	it('pages beyond the first hundred, searches server-side, and shows successful assignments immediately', async () => {
		const fixture = setup()
		render(fixture.view(1))
		await loaded()
		expect(screen.getByText('125')).toBeTruthy()
		for (let page = 2; page <= 5; page += 1) {
			fireEvent.click(screen.getByRole('button', { name: 'Next location page' }))
			await screen.findByText(`Location ${(page - 1) * 25 + 1}`)
		}
		fireEvent.click(screen.getByRole('button', { name: 'Assign Location 125' }))
		await screen.findByRole('button', { name: 'Unassign Location 125' })
		expect(fixture.assign).toHaveBeenCalledTimes(1)
		expect(success).toHaveBeenCalledTimes(1)

		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Location 125' } })
		await waitFor(() =>
			expect(fixture.listRead).toHaveBeenLastCalledWith({ page: 1, limit: 25, q: 'Location 125' }),
		)
		expect(screen.getByRole('button', { name: 'Unassign Location 125' })).toBeTruthy()
		expect(
			screen.getByRole('button', { name: 'Previous location page' }).hasAttribute('disabled'),
		).toBe(true)
	})

	it('preserves loaded assignment status after refetch failure and disables writes until recovery', async () => {
		const fixture = setup()
		render(fixture.view(1))
		await loaded()
		fixture.state.assignmentFails = true
		fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
		await screen.findByText(/Could not refresh assignments/u)
		expect(
			screen.getByRole('button', { name: 'Unassign Location 1' }).hasAttribute('disabled'),
		).toBe(true)
		expect(screen.getByRole('button', { name: 'Assign Location 2' }).hasAttribute('disabled')).toBe(
			true,
		)
		fixture.state.assignmentFails = false
		fireEvent.click(screen.getByRole('button', { name: 'Retry assignments' }))
		await waitFor(() =>
			expect(
				screen.getByRole('button', { name: 'Unassign Location 1' }).hasAttribute('disabled'),
			).toBe(false),
		)
	})

	it('never represents a failed initial assignment query as unassigned and can retry', async () => {
		const fixture = setup()
		fixture.state.assignmentFails = true
		render(fixture.view(1))
		await screen.findByText(/Could not load assignments/u)
		expect(screen.queryByText('Not assigned')).toBeNull()
		expect(screen.queryByRole('button', { name: 'Assign Location 1' })).toBeNull()
		expect(screen.getAllByText('Status unavailable')).toHaveLength(25)
		fixture.state.assignmentFails = false
		fireEvent.click(screen.getByRole('button', { name: 'Retry assignments' }))
		await screen.findByRole('button', { name: 'Unassign Location 1' })
	})

	it('distinguishes initial and refresh location errors, empty data, and no search results', async () => {
		const fixture = setup()
		fixture.state.locationFails = true
		render(fixture.view(1))
		await screen.findByText(/Could not load locations/u)
		expect(screen.queryByText('No active locations available.')).toBeNull()
		fixture.state.locationFails = false
		fireEvent.click(screen.getByRole('button', { name: 'Retry locations' }))
		await loaded()
		fixture.state.locationFails = true
		fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
		await screen.findByText(/Could not refresh locations/u)
		expect(screen.getByText('Location 1')).toBeTruthy()
		fixture.state.locationFails = false
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Missing location' } })
		await screen.findByText('No locations match your search. Try another name or code.')
		fixture.state.empty = true
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
		await screen.findByText('No active locations available.')
	})

	it.each([
		{ grant: undefined, assign: false, unassign: false },
		{ grant: 'material.create', assign: true, unassign: false },
		{ grant: 'material.delete', assign: false, unassign: true },
	])('gates each action independently with $grant access', async ({ grant, assign, unassign }) => {
		permissions.delete('material.create')
		permissions.delete('material.delete')
		if (grant) permissions.add(grant)
		const fixture = setup()
		render(fixture.view(1))
		await loaded()
		expect(Boolean(screen.queryByRole('button', { name: 'Assign Location 2' }))).toBe(assign)
		expect(Boolean(screen.queryByRole('button', { name: 'Unassign Location 1' }))).toBe(unassign)
		expect(screen.getByText('Assigned')).toBeTruthy()
	})

	it('retries the same desired action only after reading authoritative state and avoids a duplicate lost-response write', async () => {
		const fixture = setup()
		render(fixture.view(1))
		await loaded()
		fixture.state.commitThenFail = true
		fireEvent.click(screen.getByRole('button', { name: 'Assign Location 2' }))
		await screen.findByRole('button', { name: 'Retry assigning Location 2' })
		expect(screen.getByRole('button', { name: 'Unassign Location 1' })).toBeTruthy()
		expect(fixture.assign).toHaveBeenCalledTimes(1)
		expect(success).not.toHaveBeenCalled()
		const reads = fixture.assignmentRead.mock.calls.length
		fixture.state.commitThenFail = false
		fixture.state.assignmentFails = true
		fireEvent.click(screen.getByRole('button', { name: 'Retry assigning Location 2' }))
		await screen.findByText(/Could not refresh assignments/u)
		expect(fixture.assign).toHaveBeenCalledTimes(1)
		fixture.state.assignmentFails = false
		fireEvent.click(screen.getByRole('button', { name: 'Retry assigning Location 2' }))
		await screen.findByRole('button', { name: 'Unassign Location 2' })
		expect(fixture.assignmentRead.mock.calls.length).toBeGreaterThan(reads)
		expect(fixture.assign).toHaveBeenCalledTimes(1)
		expect(fixture.unassign).not.toHaveBeenCalled()
		expect(success).toHaveBeenCalledTimes(1)
	})

	it('keeps failed unassign state intact, blocks duplicate actions through mutation/refetch, and retries removal', async () => {
		const fixture = setup()
		render(fixture.view(1))
		await loaded()
		fixture.state.mutationFails = true
		fireEvent.click(screen.getByRole('button', { name: 'Unassign Location 1' }))
		await screen.findByRole('button', { name: 'Retry unassigning Location 1' })
		expect(screen.getByText('Assigned')).toBeTruthy()
		fixture.state.mutationFails = false
		const mutation = deferred()
		fixture.state.mutationGate = mutation.promise
		const retry = screen.getByRole('button', { name: 'Retry unassigning Location 1' })
		fireEvent.click(retry)
		fireEvent.click(retry)
		await waitFor(() => expect(fixture.unassign).toHaveBeenCalledTimes(2))
		const refetch = deferred()
		fixture.state.assignmentGate = refetch.promise
		await act(async () => mutation.resolve())
		expect(
			screen.getByRole('button', { name: 'Retry unassigning Location 1' }).hasAttribute('disabled'),
		).toBe(true)
		expect(screen.getByRole('button', { name: 'Assign Location 2' }).hasAttribute('disabled')).toBe(
			true,
		)
		await act(async () => refetch.resolve())
		await screen.findByRole('button', { name: 'Assign Location 1' })
		expect(fixture.unassign).toHaveBeenCalledTimes(2)
		expect(success).toHaveBeenCalledTimes(1)
	})

	it('retains action errors across pages and resets search/page/error state for a different material', async () => {
		const fixture = setup()
		const result = render(fixture.view(1))
		await loaded()
		fixture.state.mutationFails = true
		fireEvent.click(screen.getByRole('button', { name: 'Assign Location 2' }))
		await screen.findByRole('button', { name: 'Retry assigning Location 2' })
		fireEvent.click(screen.getByRole('button', { name: 'Next location page' }))
		await screen.findByText('Location 26')
		fireEvent.click(screen.getByRole('button', { name: 'Previous location page' }))
		await screen.findByRole('button', { name: 'Retry assigning Location 2' })
		fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Location 125' } })
		await screen.findByText('Location 125')
		result.rerender(fixture.view(2))
		await loaded()
		expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('')
		expect(screen.queryByRole('button', { name: 'Retry assigning Location 2' })).toBeNull()
		expect(
			within(screen.getByRole('list', { name: 'Location assignments' })).getAllByRole('listitem'),
		).toHaveLength(25)
	})

	it('does not request protected data without both read permissions', () => {
		permissions.delete('location.read')
		const fixture = setup()
		render(fixture.view(1))
		expect(
			screen.getByText('You need material and location read access to view location assignments.'),
		).toBeTruthy()
		expect(fixture.listRead).not.toHaveBeenCalled()
		expect(fixture.assignmentRead).not.toHaveBeenCalled()
	})
})
