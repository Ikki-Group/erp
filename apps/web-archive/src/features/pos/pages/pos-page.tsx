import { Outlet } from '@tanstack/react-router'

import { PosLayout } from '@/components/layout/pos-layout'

export function PosPage() {
	return (
		<PosLayout>
			<Outlet />
		</PosLayout>
	)
}
