import { MapPinIcon } from 'lucide-react'

import { StatusBadge } from '@/components/shared/status-badge.tsx'

import type { MeResponse } from '@/features/auth/dto/index.ts'

import { summarizeAccess } from '../access-summary.ts'

export function MyAccessSection({ me }: { me: MeResponse }) {
	const { globalRoles, locations } = summarizeAccess(me.locations, me.user.assignments)

	return (
		<div className="space-y-4">
			{me.isOwner && (
				<p className="text-sm">
					You are an <span className="font-medium">owner</span>: you have full access to every
					location and setting.
				</p>
			)}
			{globalRoles.length > 0 && (
				<p className="text-sm">
					Company-wide access: <span className="font-medium">{globalRoles.join(', ')}</span>. This
					applies to every location.
				</p>
			)}
			{locations.length > 0 ? (
				<ul className="divide-y rounded-lg border">
					{locations.map(({ location, roles }) => (
						<li key={location.id} className="flex flex-wrap items-center gap-3 p-3">
							<MapPinIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{location.name}</p>
								<p className="text-xs text-muted-foreground">{location.code}</p>
							</div>
							<div className="flex flex-wrap gap-1.5">
								{roles.length > 0 ? (
									roles.map((role) => (
										<StatusBadge key={role} variant="outline" dot={false}>
											{role}
										</StatusBadge>
									))
								) : (
									<span className="text-xs text-muted-foreground">No role</span>
								)}
							</div>
						</li>
					))}
				</ul>
			) : (
				<p className="text-sm text-muted-foreground">You are not assigned to any location.</p>
			)}
		</div>
	)
}
