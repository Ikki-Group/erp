import { useCallback, useMemo } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'

import { CheckIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'

import { locationResource } from '@/features/location/api.ts'

import { assignmentResource } from '../api.ts'

interface LocationAssignmentProps {
	materialId: number
}

export function LocationAssignment({ materialId }: LocationAssignmentProps) {
	const locationsQuery = useQuery(locationResource.list.queryOptions({ page: 1, limit: 100 }))
	const assignmentsQuery = useQuery(assignmentResource.byMaterial.queryOptions({ materialId }))

	const locations = locationsQuery.data?.data ?? []
	const assignments = assignmentsQuery.data?.data ?? []

	const assignMut = useMutation(assignmentResource.assign.mutationOptions())
	const unassignMut = useMutation(assignmentResource.unassign.mutationOptions())

	const assignedLocationIds = useMemo(
		() => new Set(assignments.map((a) => a.locationId)),
		[assignments],
	)

	const handleToggle = useCallback(
		async (locationId: number) => {
			if (assignedLocationIds.has(locationId)) {
				await unassignMut.mutateAsync({ materialId, locationId })
				toast.add({ title: 'Location unassigned.', type: 'success' })
			} else {
				await assignMut.mutateAsync({ materialId, locationId })
				toast.add({ title: 'Location assigned.', type: 'success' })
			}
		},
		[materialId, assignedLocationIds, assignMut, unassignMut],
	)

	if (locationsQuery.isLoading || assignmentsQuery.isLoading) {
		return (
			<div className="flex items-center justify-center py-6">
				<Spinner className="size-5" />
			</div>
		)
	}

	if (locations.length === 0) {
		return <p className="text-sm text-muted-foreground">No locations available.</p>
	}

	return (
		<div className="space-y-2">
			<p className="text-sm text-muted-foreground">Toggle which locations stock this material.</p>
			<div className="divide-y rounded-md border">
				{locations.map((loc) => {
					const isAssigned = assignedLocationIds.has(loc.id)
					const isPending = assignMut.isPending || unassignMut.isPending

					return (
						<div key={loc.id} className="flex items-center justify-between px-4 py-3">
							<div className="text-sm">
								<span className="font-medium">{loc.name}</span>
								<span className="ml-2 text-muted-foreground">({loc.code})</span>
							</div>
							<Button
								size="sm"
								variant={isAssigned ? 'default' : 'outline'}
								disabled={isPending}
								onClick={() => handleToggle(loc.id)}
							>
								{isAssigned ? (
									<>
										<CheckIcon className="mr-1 size-3.5" />
										Assigned
									</>
								) : (
									<>
										<XIcon className="mr-1 size-3.5" />
										Not Assigned
									</>
								)}
							</Button>
						</div>
					)
				})}
			</div>
		</div>
	)
}
