export const DB_NAME = {
  // Iam
  USER: 'user',
  ROLE: 'role',
  SESSION: 'session',

  // Location
  LOCATION: 'location',

  // Material
  UOM: 'uom',
  MATERIAL_CATEGORY: 'material_category',
  MATERIAL: 'material',
  MATERIAL_LOCATION: 'material_location',

  // Inventory
  STOCK_TRANSACTION: 'stock_transaction',
  STOCK_SUMMARY: 'stock_summary',
} as const

export type DB_NAME = (typeof DB_NAME)[keyof typeof DB_NAME]
