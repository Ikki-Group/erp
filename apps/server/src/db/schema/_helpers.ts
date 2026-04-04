import { pgEnum } from 'drizzle-orm/pg-core'

// ─── Shared Enums ─────────────────────────────────────────────────────────────

export const locationTypeEnum = pgEnum('location_type', ['store', 'warehouse'])
export const locationClassificationEnum = pgEnum('location_classification', ['physical', 'virtual'])

// Enforced strictly: raw (e.g. Beans), semi (e.g. Pre-made sauces), packaging (e.g. Cups)
export const materialTypeEnum = pgEnum('material_type', ['raw', 'semi', 'packaging'])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'purchase',
  'transfer_in',
  'transfer_out',
  'adjustment',
  'sell',
  'usage',
  'production_in',
  'production_out',
])

export const productStatusEnum = pgEnum('product_status', ['active', 'inactive', 'archived'])
