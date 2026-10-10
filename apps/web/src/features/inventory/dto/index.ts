import type { OpnameStatusEnum } from '@ikki/contract/inventory/opname'
import type { ReceivingStatusEnum } from '@ikki/contract/inventory/receiving'
import type { MovementTypeEnum } from '@ikki/contract/inventory/stock'
import type { TransferStatusEnum } from '@ikki/contract/inventory/transfer'

export {
	MovementDirectionEnum,
	MovementTypeEnum,
	StockBalanceDto,
	StockBalanceFilterDto,
	StockBalanceStatusEnum,
	StockMovementDto,
	StockMovementFilterDto,
} from '@ikki/contract/inventory/stock'
export {
	TransferCreateDto,
	TransferDetailDto,
	TransferDto,
	TransferFilterDto,
	TransferLineDto,
	TransferReceiveDto,
	TransferShipDto,
	TransferStatusEnum,
} from '@ikki/contract/inventory/transfer'
export {
	OpnameCompleteDto,
	OpnameCreateDto,
	OpnameDetailDto,
	OpnameDto,
	OpnameFilterDto,
	OpnameLineDto,
	OpnameStatusEnum,
	OpnameUpdateCountsDto,
} from '@ikki/contract/inventory/opname'
export {
	ReceivingConfirmDto,
	ReceivingCreateDto,
	ReceivingDetailDto,
	ReceivingDto,
	ReceivingFilterDto,
	ReceivingLineDto,
	ReceivingStatusEnum,
	ReceivingUpdateDto,
} from '@ikki/contract/inventory/receiving'

// ─── UI labels (web-only) ───

export const MOVEMENT_TYPE_LABELS: Record<MovementTypeEnum, string> = {
	purchase_receipt: 'Penerimaan',
	transfer_in: 'Transfer Masuk',
	transfer_out: 'Transfer Keluar',
	production_in: 'Produksi Masuk',
	production_out: 'Produksi Keluar',
	sales: 'Penjualan',
	adjustment_in: 'Penyesuaian Masuk',
	adjustment_out: 'Penyesuaian Keluar',
	return_in: 'Retur Masuk',
}

export const TRANSFER_STATUS_LABELS: Record<TransferStatusEnum, string> = {
	requested: 'Diajukan',
	in_transit: 'Dalam Perjalanan',
	received: 'Diterima',
	cancelled: 'Dibatalkan',
}

export const OPNAME_STATUS_LABELS: Record<OpnameStatusEnum, string> = {
	draft: 'Draft',
	in_progress: 'Sedang Berjalan',
	completed: 'Selesai',
	cancelled: 'Dibatalkan',
}

export const RECEIVING_STATUS_LABELS: Record<ReceivingStatusEnum, string> = {
	draft: 'Draft',
	confirmed: 'Dikonfirmasi',
}
