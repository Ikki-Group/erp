import { useMemo, useRef, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { toast } from '@/components/ui/toast'

import { locationResource } from '@/features/location/api.ts'

import { assignmentResource } from './api.ts'

interface LocationAction {
	locationId: number
	locationName: string
	assigned: boolean
}

interface FailedLocationAction extends LocationAction {
	message: string
}

interface AssignmentPermissions {
	canAssign: boolean
	canUnassign: boolean
}

const PAGE_SIZE = 25

/** Material-wide assignment state is independent of the current location search/page. */
export function useLocationAssignment(materialId: number, permissions: AssignmentPermissions) {
	const client = useQueryClient()
	const [search, setSearch] = useState({ page: 1, q: '' })
	const [failedActions, setFailedActions] = useState<Record<number, FailedLocationAction>>({})
	const [pendingLocationId, setPendingLocationId] = useState<number | null>(null)
	const [isRefreshing, setRefreshing] = useState(false)
	const [isUncertain, setUncertain] = useState(false)
	const operationRef = useRef(false)
	const uncertainRef = useRef(false)

	const locationsQuery = useQuery({
		...locationResource.list.queryOptions({
			page: search.page,
			limit: PAGE_SIZE,
			q: search.q || undefined,
		}),
		throwOnError: false,
	})
	const assignmentsQuery = useQuery({
		...assignmentResource.byMaterial.queryOptions({ materialId }),
		throwOnError: false,
	})
	// Non-idempotent writes must only retry after a fresh read confirms they are still needed.
	const assignMut = useMutation(
		assignmentResource.assign.mutationOptions({ retry: false, throwOnError: false }),
	)
	const unassignMut = useMutation(
		assignmentResource.unassign.mutationOptions({ retry: false, throwOnError: false }),
	)
	const assignedLocationIds = useMemo(
		() => new Set(assignmentsQuery.data?.data.map((assignment) => assignment.locationId)),
		[assignmentsQuery.data],
	)
	const isBusy = pendingLocationId !== null || isRefreshing
	const canChange =
		assignmentsQuery.data !== undefined &&
		!assignmentsQuery.isError &&
		!assignmentsQuery.isFetching &&
		!isBusy &&
		!isUncertain

	async function refreshAssignments() {
		if (operationRef.current) return
		operationRef.current = true
		setRefreshing(true)
		try {
			const result = await assignmentsQuery.refetch()
			if (result.isSuccess) {
				uncertainRef.current = false
				setUncertain(false)
			}
		} finally {
			operationRef.current = false
			setRefreshing(false)
		}
	}

	async function run(action: LocationAction, retry = false) {
		if (operationRef.current) return
		if (action.assigned ? !permissions.canAssign : !permissions.canUnassign) return

		const key = assignmentResource.byMaterial.queryKey({ materialId })
		const current = client.getQueryState(key)
		if (
			!retry &&
			(uncertainRef.current || current?.status !== 'success' || current.fetchStatus !== 'idle')
		) {
			return
		}

		operationRef.current = true
		setPendingLocationId(action.locationId)
		try {
			let assignments = client.getQueryData(key)
			if (retry) {
				// The previous response may have been lost after the server committed the change.
				const result = await assignmentsQuery.refetch()
				if (!result.isSuccess) {
					throw result.error ?? new Error('Could not verify the current assignments.')
				}
				assignments = result.data
				uncertainRef.current = false
				setUncertain(false)
			}
			if (!assignments) throw new Error('Load assignments before making changes.')

			const isAssigned = assignments.data.some(
				(assignment) => assignment.locationId === action.locationId,
			)
			if (isAssigned !== action.assigned) {
				const mutation = action.assigned ? assignMut : unassignMut
				// Resource-owned invalidation is awaited by mutateAsync, including active refetches.
				await mutation.mutateAsync({ materialId, locationId: action.locationId })
			}
			setFailedActions((previous) => {
				const next = { ...previous }
				delete next[action.locationId]
				return next
			})
			toast.add({
				title: action.assigned ? 'Location assigned.' : 'Location unassigned.',
				type: 'success',
			})
		} catch (error) {
			uncertainRef.current = true
			setUncertain(true)
			setFailedActions((previous) => ({
				...previous,
				[action.locationId]: {
					...action,
					message: error instanceof Error ? error.message : 'The assignment could not be saved.',
				},
			}))
		} finally {
			operationRef.current = false
			setPendingLocationId(null)
		}
	}

	return {
		locationsQuery,
		assignmentsQuery,
		assignedLocationIds,
		failedActions,
		pendingLocationId,
		isBusy,
		isUncertain,
		canChange,
		page: search.page,
		search: search.q,
		setSearch: (q: string) => setSearch({ page: 1, q }),
		setPage: (page: number) => setSearch((previous) => ({ ...previous, page })),
		refreshAssignments,
		run,
	}
}
