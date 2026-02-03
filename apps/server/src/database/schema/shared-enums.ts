import { dbSchema } from './db-schema'

export const materialTypeEnum = dbSchema.enum('material_type', ['raw', 'semi'])

export const locationTypeEnum = dbSchema.enum('location_type', ['OFFICE', 'WAREHOUSE', 'STORE', 'FACTORY'])
