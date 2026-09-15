import type { DomainEvent } from './event-bus.port.ts'

type StockMovementType =
	| 'purchase_receipt'
	| 'transfer_in'
	| 'transfer_out'
	| 'production_in'
	| 'production_out'
	| 'sales'
	| 'adjustment_in'
	| 'adjustment_out'
	| 'return_in'

type StockMovementDirection = 'in' | 'out'

export interface StockMovementRecorded extends DomainEvent {
	readonly type: 'StockMovementRecorded'
	readonly movementId: number
	readonly materialId: number
	readonly locationId: number
	readonly movementType: StockMovementType
	readonly direction: StockMovementDirection
	readonly quantity: string
	readonly costPrice: string
	readonly referenceType: string | null
	readonly referenceId: number | null
	readonly actorId: number
}
