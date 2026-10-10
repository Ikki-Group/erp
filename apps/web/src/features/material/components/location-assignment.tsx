import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/shared/empty-state'
import { PageError } from '@/components/shared/page-error'

import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/toast'

import { locationResource } from '@/features/location/api.ts'

import { assignmentResource } from '../api.ts'

interface LocationAssignmentProps {
	materialId: number
	/** Shows the assignment state without toggles (no assign permission). */
	readOnly?: boolean
}

export function LocationAssignment({ materialId, readOnly = false }: LocationAssignmentProps) {
	const locationsQuery = useQuery(locationResource.list.queryOptions({ page: 1, limit: 100 }))
	const assignmentsQuery = useQuery(assignmentResource.byMaterial.queryOptions({ materialId }))

	const locations = locationsQuery.data?.data ?? []
	const assignments = assignmentsQuery.data?.data ?? []

	const assignMut = useMutation(assignmentResource.assign.mutationOptions())
	const unassignMut = useMutation(assignmentResource.unassign.mutationOptions())
	const isPending = assignMut.isPending || unassignMut.isPending

	const assignedLocationIds = useMemo(
		() => new Set(assignments.map((a) => a.locationId)),
		[assignments],
	)

	const handleToggle = useCallback(
		async (locationId: number, assign: boolean) => {
			if (assign) {
				await assignMut.mutateAsync({ materialId, locationId })
				toast.add({ title: 'Location assigned.', type: 'success' })
			} else {
				await unassignMut.mutateAsync({ materialId, locationId })
				toast.add({ title: 'Location unassigned.', type: 'success' })
			}
		},
		[materialId, assignMut, unassignMut],
	)

	if (locationsQuery.isError || assignmentsQuery.isError) {
		return (
			<PageError
				message="Could not load location assignments."
				onRetry={() => {
					void locationsQuery.refetch()
					void assignmentsQuery.refetch()
				}}
			/>
		)
	}

	if (locationsQuery.isLoading || assignmentsQuery.isLoading) {
		return (
			<div className="divide-y rounded-lg border">
				{[0, 1, 2].map((i) => (
					<div key={i} className="flex items-center justify-between px-4 py-3">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-4 w-7 rounded-full" />
					</div>
				))}
			</div>
		)
	}

	if (locations.length === 0) {
		return <EmptyState title="No locations" description="Create a location first." />
	}

	return (
		<ul className="divide-y rounded-lg border">
			{locations.map((loc) => {
				const isAssigned = assignedLocationIds.has(loc.id)
				const switchId = `material-${materialId}-location-${loc.id}`
				return (
					<li key={loc.id}>
						<label
							htmlFor={switchId}
							className="flex min-h-11 items-center justify-between gap-4 px-4 py-2.5 has-[[data-disabled]]:cursor-default"
						>
							<span className="min-w-0 text-sm">
								<span className="font-medium">{loc.name}</span>
								<span className="ml-2 font-mono text-xs text-muted-foreground">{loc.code}</span>
							</span>
							<span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
								{isAssigned ? 'Stocked' : 'Not stocked'}
								<Switch
									id={switchId}
									checked={isAssigned}
									disabled={readOnly || isPending}
									onCheckedChange={(checked) => void handleToggle(loc.id, checked)}
								/>
							</span>
						</label>
					</li>
				)
			})}
		</ul>
	)
}
