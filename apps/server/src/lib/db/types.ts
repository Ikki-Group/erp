import type { HydratedDocument, InferSchemaType } from 'mongoose'

import type { MetadataSchema } from './schema'

/** A Mongoose hydrated document (has methods, virtuals, _id, etc.) */
export type Hydrated<Schema> = HydratedDocument<InferSchemaType<Schema>>

/** Infers the plain TypeScript type from a Mongoose Schema. No methods or virtuals. */
export type InferSchema<Schema> = InferSchemaType<Schema>

/** @deprecated Use `InferSchema<T>` instead. Kept for backwards compatibility. */
export type HydratedSchema<Schema> = InferSchemaType<Schema>

/** Inferred type of the shared MetadataSchema. Always stays in sync with the schema definition. */
export type IMetadataSchema = InferSchemaType<typeof MetadataSchema>

/** Shorthand for T | null */
export type Nullable<T> = T | null
