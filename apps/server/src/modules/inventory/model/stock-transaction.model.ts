import { model, Schema } from 'mongoose'

import { MetadataSchema } from '@/lib/db'

import { DB_NAME } from '@/config/db-name'

import { TransactionType, type StockTransactionDto } from '../dto'

const stockTransactionSchema = new Schema<StockTransactionDto>({
  materialId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: DB_NAME.MATERIAL,
  },
  locationId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: DB_NAME.LOCATION,
  },

  type: { type: String, enum: TransactionType.options, required: true },
  date: { type: Date, required: true },
  referenceNo: { type: String, required: true },
  notes: { type: String, default: null },

  // Quantity & Cost
  qty: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  totalCost: { type: Number, required: true },

  // Transfer-specific
  counterpartLocationId: {
    type: Schema.Types.ObjectId,
    ref: DB_NAME.LOCATION,
    default: null,
  },
  transferId: {
    type: Schema.Types.ObjectId,
    default: null,
  },

  // Running snapshot
  runningQty: { type: Number, required: true },
  runningAvgCost: { type: Number, required: true },
}).add(MetadataSchema)

stockTransactionSchema
  .index({ materialId: 1, locationId: 1, date: -1 }, { name: 'material_location_date_idx' })
  .index({ locationId: 1, date: -1 }, { name: 'location_date_idx' })
  .index({ type: 1, date: -1 }, { name: 'type_date_idx' })
  .index({ transferId: 1 }, { name: 'transfer_idx', sparse: true })
  .index({ referenceNo: 1 }, { name: 'reference_no_idx' })

export const StockTransactionModel = model(DB_NAME.STOCK_TRANSACTION, stockTransactionSchema)
