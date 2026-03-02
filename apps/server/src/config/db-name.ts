export const DB_NAME = {
  // Iam
  USER: 'user',
  ROLE: 'role',
  SESSION: 'session',

  // Location
  LOCATION: 'location',

  // Material
  MATERIAL: 'material',
  MATERIAL_CATEGORY: 'material_category',
  MATERIAL_UOM: 'material_uom',
} as const

export type DB_NAME = (typeof DB_NAME)[keyof typeof DB_NAME]
