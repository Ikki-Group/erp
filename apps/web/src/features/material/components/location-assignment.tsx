import { useCallback, useMemo } from 'react'

import { useMutation, useQueries, useQuery } from '@tanstack/react-query'

import { CheckIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'

import { locationResource } from '@/features/location/api.ts'

import { assignmentResource } from '../api.ts'
import type { MaterialLocationDto } from '../dto/index.ts'

interface LocationAssignmentProps {
	materialId: number
}

export function LocationAssignment({ materialId }: LocationAssignmentProps) {
	const locationsQuery = useQuery(locationResource.list.queryOptions({ page: 1, limit: 100 }))
	const locations = locationsQuery.data?.data ?? []

	const assignmentQueries = useQueries({
		queries: locations.map((loc) =>
			assignmentResource.byLocation.queryOptions({ locationId: loc.id }),
		),
	})

	const assignMut = useMutation(assignmentResource.assign.mutationOptions())
	const unassignMut = useMutation(assignmentResource.unassign.mutationOptions())

	const assignmentMap = useMemo(() => {
		const map = new Map<number, MaterialLocationDto>()
		for (const q of assignmentQueries) {
			const assignments = q.data?.data ?? []
			for (const a of assignments) {
				if (a.materialId === materialId) {
					map.set(a.locationId, a)
				}
			}
		}
		return map
	}, [assignmentQueries, materialId])

	const handleToggle = useCallback(
		async (locationId: number) => {
			const existing = assignmentMap.get(locationId)
			if (existing) {
				await unassignMut.mutateAsync({ materialId, locationId })
				toast.add({ title: 'Location unassigned.', type: 'success' })
			} else {
				await assignMut.mutateAsync({ materialId, locationId })
				toast.add({ title: 'Location assigned.', type: 'success' })
			}
		},
		[materialId, assignmentMap, assignMut, unassignMut],
	)

	if (locationsQuery.isLoading) {
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
					const isAssigned = assignmentMap.has(loc.id)
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
