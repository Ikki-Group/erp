import { model, Schema } from 'mongoose'

import { MetadataSchema } from '@/lib/db'

import { DB_NAME } from '@/config/db-name'

import type { StockSummaryDto } from '../dto'

const stockSummarySchema = new Schema<StockSummaryDto>({
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
  date: { type: Date, required: true },

  // Opening balance
  openingQty: { type: Number, required: true, default: 0 },
  openingAvgCost: { type: Number, required: true, default: 0 },
  openingValue: { type: Number, required: true, default: 0 },

  // Movements
  purchaseQty: { type: Number, default: 0 },
  purchaseValue: { type: Number, default: 0 },
  transferInQty: { type: Number, default: 0 },
  transferInValue: { type: Number, default: 0 },
  transferOutQty: { type: Number, default: 0 },
  transferOutValue: { type: Number, default: 0 },
  adjustmentQty: { type: Number, default: 0 },
  adjustmentValue: { type: Number, default: 0 },
  sellQty: { type: Number, default: 0 },
  sellValue: { type: Number, default: 0 },

  // Closing balance
  closingQty: { type: Number, required: true, default: 0 },
  closingAvgCost: { type: Number, required: true, default: 0 },
  closingValue: { type: Number, required: true, default: 0 },
}).add(MetadataSchema)

stockSummarySchema
  .index({ materialId: 1, locationId: 1, date: 1 }, { name: 'material_location_date_idx', unique: true })
  .index({ locationId: 1, date: 1 }, { name: 'location_date_idx' })
  .index({ date: 1 }, { name: 'date_idx' })

export const StockSummaryModel = model(DB_NAME.STOCK_SUMMARY, stockSummarySchema)
