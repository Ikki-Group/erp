import { pgEnum } from 'drizzle-orm/pg-core'

const locationType = pgEnum('location_type', ['store', 'warehouse', 'central_warehouse'])

export { locationType }
