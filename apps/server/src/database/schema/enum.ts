import { pgEnum } from 'drizzle-orm/pg-core'

const locationType = pgEnum('location_type', ['store', 'warehouse'])
const materialType = pgEnum('material_type', ['raw', 'semi'])
const itemType = pgEnum('item_type', ['raw', 'semi'])

export { itemType, locationType, materialType }
